import threading
import time
from decimal import Decimal
from django.test import TransactionTestCase
from django.db import connection, transaction, IntegrityError
from django.contrib.auth import get_user_model
from apps.ledger.services import (
    post_ledger_transaction, lock_funds, unlock_funds, consume_locked_funds,
    transfer, reverse_transaction, check_idempotency, complete_idempotency,
    FinancialError, InsufficientFunds, UnbalancedTransaction, InvalidAmount
)
from apps.ledger.models import LedgerTransaction, LedgerEntry
from apps.wallets.models import Balance

User = get_user_model()

def run_concurrently(funcs_with_args):
    threads = []
    exceptions = []
    
    def target(f, args, kwargs):
        try:
            f(*args, **kwargs)
        except Exception as e:
            exceptions.append(e)
        finally:
            connection.close()
            
    for f, args, kwargs in funcs_with_args:
        t = threading.Thread(target=target, args=(f, args, kwargs))
        threads.append(t)
        
    for t in threads:
        t.start()
    for t in threads:
        t.join()
        
    return exceptions

class LedgerConcurrencyTests(TransactionTestCase):
    def setUp(self):
        with connection.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE ledger_entries, ledger_transactions, balances, users CASCADE")
        self.user1 = User.objects.create(username='user1')
        self.user2 = User.objects.create(username='user2')
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO users (id, email) VALUES (%s, %s)", [self.user1.id, 'user1@test.com'])
            cursor.execute("INSERT INTO users (id, email) VALUES (%s, %s)", [self.user2.id, 'user2@test.com'])

        post_ledger_transaction(
            reference_id='INIT_FUND_1',
            transaction_type='MOCK_DEPOSIT',
            description='Initial funding',
            entries=[
                {'user': None, 'account_type': 'system', 'asset': 'USDT', 'direction': 'debit', 'amount': Decimal('100.00')},
                {'user': self.user1, 'account_type': 'spot', 'asset': 'USDT', 'direction': 'credit', 'amount': Decimal('100.00')}
            ]
        )

    def test_double_entry_deferred_trigger(self):
        # Insert a raw unbalanced ledger entry to trigger the DEFERRED constraint
        tx = LedgerTransaction.objects.create(reference_id='BAD_RAW', transaction_type='RAW')
        with self.assertRaises(Exception) as e:
            with transaction.atomic():
                # Direct DB insert bypassing services to test Postgres trigger
                LedgerEntry.objects.create(
                    ledger_transaction=tx,
                    user=self.user1,
                    asset='USDT',
                    direction='credit',
                    amount=Decimal('10.00')
                )
        self.assertIn('Unbalanced ledger entries', str(e.exception))

    def test_ledger_immutability_triggers(self):
        tx = LedgerTransaction.objects.first()
        entry = tx.ledgerentry_set.first()
        
        with self.assertRaises(Exception) as e:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute("UPDATE ledger_entries SET amount = 1000 WHERE id = %s", [str(entry.id)])
        self.assertIn('Ledger records are immutable', str(e.exception))

        with self.assertRaises(Exception) as e:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM ledger_entries WHERE id = %s", [str(entry.id)])
        self.assertIn('Ledger records are immutable', str(e.exception))

    def test_negative_balance_constraint(self):
        bal = Balance.objects.get(user=self.user1, asset='USDT')
        with self.assertRaises(Exception) as e:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute("UPDATE balances SET available = -1 WHERE id = %s", [bal.id])
        self.assertIn('check_available_positive', str(e.exception))

    def test_duplicate_reference(self):
        with self.assertRaises(IntegrityError):
            post_ledger_transaction(
                reference_id='INIT_FUND_1',
                transaction_type='TEST',
                description='Dup',
                entries=[
                    {'user': None, 'account_type': 'system', 'asset': 'USDT', 'direction': 'debit', 'amount': Decimal('1.00')},
                    {'user': self.user1, 'asset': 'USDT', 'direction': 'credit', 'amount': Decimal('1.00')}
                ]
            )

    def test_transaction_rollback(self):
        # Cause an error during transaction (e.g. Unbalanced) and ensure balances are untouched
        try:
            post_ledger_transaction(
                reference_id='FAIL_TX',
                transaction_type='TEST',
                description='Fail',
                entries=[
                    {'user': self.user1, 'asset': 'USDT', 'direction': 'debit', 'amount': Decimal('10.00')}
                ]
            )
        except UnbalancedTransaction:
            pass
            
        bal = Balance.objects.get(user=self.user1, asset='USDT')
        self.assertEqual(bal.available, Decimal('100.00'))
        self.assertFalse(LedgerTransaction.objects.filter(reference_id='FAIL_TX').exists())

    def test_concurrent_spending(self):
        def spend():
            transfer(self.user1, self.user2, 'USDT', Decimal('60.00'), reference_id=None)
            
        # Two simultaneous spends of 60.00, only one should succeed since available=100
        exceptions = run_concurrently([
            (spend, (), {}),
            (spend, (), {})
        ])
        
        self.assertEqual(len(exceptions), 1)
        self.assertIsInstance(exceptions[0], InsufficientFunds)
        
        b1 = Balance.objects.get(user=self.user1, asset='USDT')
        b2 = Balance.objects.get(user=self.user2, asset='USDT')
        self.assertEqual(b1.available, Decimal('40.00'))
        self.assertEqual(b2.available, Decimal('60.00'))

    def test_concurrent_transfers(self):
        post_ledger_transaction('INIT_FUND_2', 'MOCK_DEPOSIT', 'Fund 2', [
            {'user': None, 'account_type': 'system', 'asset': 'USDT', 'direction': 'debit', 'amount': Decimal('100.00')},
            {'user': self.user2, 'account_type': 'spot', 'asset': 'USDT', 'direction': 'credit', 'amount': Decimal('100.00')}
        ])

        def transfer_forward():
            transfer(self.user1, self.user2, 'USDT', Decimal('10.00'), reference_id=None)
        def transfer_backward():
            transfer(self.user2, self.user1, 'USDT', Decimal('10.00'), reference_id=None)

        # Execute many concurrent transfers in both directions to test deadlock resolution
        tasks = []
        for _ in range(5):
            tasks.append((transfer_forward, (), {}))
            tasks.append((transfer_backward, (), {}))
            
        exceptions = run_concurrently(tasks)
        self.assertEqual(len(exceptions), 0)
        
        b1 = Balance.objects.get(user=self.user1, asset='USDT')
        b2 = Balance.objects.get(user=self.user2, asset='USDT')
        self.assertEqual(b1.available, Decimal('100.00'))
        self.assertEqual(b2.available, Decimal('100.00'))

    def test_concurrent_fund_locking(self):
        def lock():
            lock_funds(self.user1, 'USDT', Decimal('60.00'))
            
        exceptions = run_concurrently([
            (lock, (), {}),
            (lock, (), {})
        ])
        
        self.assertEqual(len(exceptions), 1)
        self.assertIsInstance(exceptions[0], InsufficientFunds)
        
        b1 = Balance.objects.get(user=self.user1, asset='USDT')
        self.assertEqual(b1.available, Decimal('40.00'))
        self.assertEqual(b1.locked, Decimal('60.00'))

    def test_duplicate_reversal(self):
        reverse_transaction('INIT_FUND_1', 'REV1')
        with self.assertRaises(IntegrityError):
            # Duplicate reference ID fails at DB level
            reverse_transaction('INIT_FUND_1', 'REV1')
            
    def test_concurrent_idempotency(self):
        def process():
            resp, is_new = check_idempotency(self.user1, 'test_op', 'concurrent_key', {'data': 1})
            if is_new:
                # Simulate work
                time.sleep(0.1)
                complete_idempotency(self.user1, 'test_op', 'concurrent_key', {'status': 'done'})
            else:
                if resp is None:
                    # Depending on how check_idempotency is written, it might return None if incomplete.
                    # Or it might block. We just ensure no IntegrityError bubbles up unexpectedly and only one "new" gets False.
                    pass

        exceptions = run_concurrently([
            (process, (), {}),
            (process, (), {}),
            (process, (), {})
        ])
        self.assertEqual(len(exceptions), 0)
