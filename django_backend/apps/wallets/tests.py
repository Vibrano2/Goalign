from decimal import Decimal
from django.test import TransactionTestCase
from django.db import connection, transaction, IntegrityError
from django.contrib.auth import get_user_model
from apps.wallets.models import WithdrawalRequest, Balance
from apps.ledger.services import lock_funds, post_ledger_transaction

User = get_user_model()

class WalletFinancialTests(TransactionTestCase):
    def setUp(self):
        with connection.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE ledger_entries, ledger_transactions, balances, users CASCADE")
        self.user1 = User.objects.create(username='user1')
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO users (id, email) VALUES (%s, %s)", [self.user1.id, 'user1@test.com'])
            
        post_ledger_transaction(
            reference_id='INIT_FUND_1',
            transaction_type='MOCK_DEPOSIT',
            description='Initial funding',
            entries=[
                {'user': None, 'account_type': 'system', 'asset': 'USDT', 'direction': 'debit', 'amount': Decimal('100.00')},
                {'user': self.user1, 'account_type': 'spot', 'asset': 'USDT', 'direction': 'credit', 'amount': Decimal('100.00')}
            ]
        )
        post_ledger_transaction(
            reference_id='INIT_FUND_FUT',
            transaction_type='MOCK_DEPOSIT',
            description='Initial funding futures',
            entries=[
                {'user': None, 'account_type': 'system', 'asset': 'USDT', 'direction': 'debit', 'amount': Decimal('50.00')},
                {'user': self.user1, 'account_type': 'futures', 'asset': 'USDT', 'direction': 'credit', 'amount': Decimal('50.00')}
            ]
        )

    def test_account_type_isolation(self):
        spot_bal = Balance.objects.get(user=self.user1, asset='USDT', account_type='spot')
        fut_bal = Balance.objects.get(user=self.user1, asset='USDT', account_type='futures')
        
        self.assertEqual(spot_bal.available, Decimal('100.00'))
        self.assertEqual(fut_bal.available, Decimal('50.00'))
        
        # We can't spend from spot what we have in futures
        with self.assertRaises(Exception):
            post_ledger_transaction(
                reference_id='FAIL_SPEND',
                transaction_type='SPEND',
                description='Spend',
                entries=[
                    {'user': self.user1, 'account_type': 'spot', 'asset': 'USDT', 'direction': 'debit', 'amount': Decimal('120.00')},
                    {'user': None, 'account_type': 'system', 'asset': 'USDT', 'direction': 'credit', 'amount': Decimal('120.00')}
                ]
            )

    def test_withdrawal_state_transitions(self):
        wr = WithdrawalRequest.objects.create(
            user=self.user1,
            asset='USDT',
            amount=Decimal('10.00'),
            address='0x123',
            network='ERC20',
            status='pending',
            idempotency_key='wd1'
        )
        
        # Test missing provider_txid trigger block
        with self.assertRaises(Exception) as e:
            with transaction.atomic():
                wr.status = 'completed'
                wr.save()
        self.assertIn('Cannot mark withdrawal', str(e.exception))
        
        # Test success
        wr.status = 'completed'
        wr.provider_txid = '0xtxid'
        wr.save()
        self.assertEqual(wr.status, 'completed')
        
    def test_withdrawal_invalid_state(self):
        # Database checks status IN ('pending', 'processing', 'completed', 'rejected')
        with self.assertRaises(Exception):
            with transaction.atomic():
                WithdrawalRequest.objects.create(
                    user=self.user1,
                    asset='USDT',
                    amount=Decimal('10.00'),
                    address='0x123',
                    network='ERC20',
                    status='unknown_state',
                    idempotency_key='wd2'
                )
