import hashlib
import json
from decimal import Decimal
from django.db import transaction, IntegrityError
from django.db.models import F
from apps.ledger.models import LedgerTransaction, LedgerEntry, IdempotencyKey
from apps.wallets.models import Balance
from apps.audit.models import AuditLog

class FinancialError(Exception):
    pass

class InsufficientFunds(FinancialError):
    pass

class UnbalancedTransaction(FinancialError):
    pass

class InvalidAmount(FinancialError):
    pass

def _ensure_balance(user, asset, account_type='spot'):
    if not user:
        return
    asset = asset.upper()
    uid = user.id if hasattr(user, 'id') else user
    Balance.objects.get_or_create(
        user_id=uid,
        asset=asset,
        account_type=account_type,
        defaults={'total': Decimal('0.00000000'), 'available': Decimal('0.00000000'), 'locked': Decimal('0.00000000')}
    )

def _lock_balances_deterministically(entries):
    """
    Lock balance rows in a deterministic order to prevent deadlocks.
    """
    balance_keys = set()
    for entry in entries:
        if entry.get('user'):
            balance_keys.add((entry['user'].id, entry['asset'].upper(), entry.get('account_type', 'spot')))
    
    # Sort by user_id, asset, account_type
    sorted_keys = sorted(list(balance_keys))
    
    # Ensure they exist first
    for user_id, asset, account_type in sorted_keys:
        _ensure_balance(user_id, asset, account_type)
        
    # Lock them in order
    for user_id, asset, account_type in sorted_keys:
        # We just execute a SELECT FOR UPDATE to acquire the lock
        list(Balance.objects.select_for_update().filter(user_id=user_id, asset=asset, account_type=account_type))

@transaction.atomic
def post_ledger_transaction(reference_id, transaction_type, description, entries):
    """
    entries format: [{'user': user_obj, 'account_type': 'spot', 'asset': 'USDT', 'direction': 'credit', 'amount': Decimal('100.00')}, ...]
    """
    # 1. Validate entries
    asset_totals = {}
    for entry in entries:
        amount = entry.get('amount')
        if not isinstance(amount, Decimal):
            raise FinancialError(f"Amount must be a Decimal, got {type(amount)}")
        if amount.is_nan() or amount.is_infinite() or amount <= 0:
            raise InvalidAmount("Ledger entry amounts must be finite and greater than zero")
            
        direction = entry.get('direction')
        if direction not in ('credit', 'debit'):
            raise FinancialError(f"Invalid direction: {direction}")
            
        asset = entry['asset'].upper()
        if asset not in asset_totals:
            asset_totals[asset] = Decimal('0.00000000')
            
        if direction == 'credit':
            asset_totals[asset] += amount
        else:
            asset_totals[asset] -= amount

    for asset, net in asset_totals.items():
        if abs(net) > Decimal('0.00000001'):
            raise UnbalancedTransaction(f"Unbalanced ledger entries for asset {asset}. Net: {net}")

    # 2. Lock balances deterministically
    _lock_balances_deterministically(entries)

    # 3. Create Transaction
    tx = LedgerTransaction.objects.create(
        reference_id=reference_id,
        transaction_type=transaction_type,
        description=description,
        status='completed'
    )

    # 4. Create Entries and Update Balances
    for entry in entries:
        amount = entry['amount']
        asset = entry['asset'].upper()
        account_type = entry.get('account_type', 'spot')
        direction = entry['direction']
        user = entry.get('user')
        user_id = user.id if user else None

        LedgerEntry.objects.create(
            ledger_transaction=tx,
            user_id=user_id,
            account_type=account_type,
            asset=asset,
            direction=direction,
            amount=amount
        )

        if user_id:
            if direction == 'credit':
                updated = Balance.objects.filter(
                    user_id=user_id, asset=asset, account_type=account_type
                ).update(
                    total=F('total') + amount,
                    available=F('available') + amount
                )
            else:
                updated = Balance.objects.filter(
                    user_id=user_id, asset=asset, account_type=account_type, available__gte=amount
                ).update(
                    total=F('total') - amount,
                    available=F('available') - amount
                )
                if updated == 0:
                    raise InsufficientFunds(f"Insufficient {asset} balance for user {user_id} ({account_type})")

    return tx

@transaction.atomic
def lock_funds(user, asset, amount, account_type='spot'):
    if not isinstance(amount, Decimal) or amount <= 0 or amount.is_nan() or amount.is_infinite():
        raise InvalidAmount("Lock amount must be a positive finite Decimal")
        
    asset = asset.upper()
    uid = user.id if hasattr(user, 'id') else user
    _ensure_balance(uid, asset, account_type)
    
    updated = Balance.objects.filter(
        user_id=uid, asset=asset, account_type=account_type, available__gte=amount
    ).update(
        available=F('available') - amount,
        locked=F('locked') + amount
    )
    if updated == 0:
        raise InsufficientFunds(f"Insufficient {asset} available balance to lock")

@transaction.atomic
def unlock_funds(user, asset, amount, account_type='spot'):
    if not isinstance(amount, Decimal) or amount <= 0 or amount.is_nan() or amount.is_infinite():
        raise InvalidAmount("Unlock amount must be a positive finite Decimal")

    uid = user.id if hasattr(user, 'id') else user
    asset = asset.upper()
    updated = Balance.objects.filter(
        user_id=uid, asset=asset, account_type=account_type, locked__gte=amount
    ).update(
        available=F('available') + amount,
        locked=F('locked') - amount
    )
    if updated == 0:
        raise InsufficientFunds(f"Insufficient {asset} locked balance to unlock")

@transaction.atomic
def consume_locked_funds(user, asset, amount, account_type='spot'):
    if not isinstance(amount, Decimal) or amount <= 0 or amount.is_nan() or amount.is_infinite():
        raise InvalidAmount("Consume amount must be a positive finite Decimal")

    uid = user.id if hasattr(user, 'id') else user
    asset = asset.upper()
    updated = Balance.objects.filter(
        user_id=uid, asset=asset, account_type=account_type, locked__gte=amount
    ).update(
        total=F('total') - amount,
        locked=F('locked') - amount
    )
    if updated == 0:
        raise InsufficientFunds(f"Insufficient {asset} locked balance to consume")

@transaction.atomic
def transfer(sender, receiver, asset, amount, account_type='spot', reference_id=None):
    """
    Internal transfer between users. Balances double-entry rules.
    """
    if sender == receiver:
        raise FinancialError("Sender and receiver cannot be the same")
        
    entries = [
        {'user': sender, 'account_type': account_type, 'asset': asset, 'direction': 'debit', 'amount': amount},
        {'user': receiver, 'account_type': account_type, 'asset': asset, 'direction': 'credit', 'amount': amount},
    ]
    
    tx = post_ledger_transaction(
        reference_id=reference_id,
        transaction_type='INTERNAL_TRANSFER',
        description=f'Transfer from {sender.id} to {receiver.id}',
        entries=entries
    )
    
    AuditLog.objects.create(
        actor=sender,
        action='INTERNAL_TRANSFER',
        target_type='User',
        target_identifier=str(receiver.id),
        metadata={'asset': asset, 'amount': str(amount), 'reference_id': reference_id, 'ip_address': '0.0.0.0'}
    )
    
    return tx

@transaction.atomic
def reverse_transaction(original_reference_id, new_reference_id, actor=None):
    """
    Reverses an original transaction by creating inverse entries.
    """
    try:
        orig_tx = LedgerTransaction.objects.get(reference_id=original_reference_id)
    except LedgerTransaction.DoesNotExist:
        raise FinancialError("Original transaction not found")
        
    orig_entries = orig_tx.ledgerentry_set.all()
    
    new_entries = []
    for entry in orig_entries:
        inverse_dir = 'credit' if entry.direction == 'debit' else 'debit'
        new_entries.append({
            'user': entry.user,
            'account_type': entry.account_type,
            'asset': entry.asset,
            'direction': inverse_dir,
            'amount': entry.amount
        })
        
    tx = post_ledger_transaction(
        reference_id=new_reference_id,
        transaction_type='REVERSAL',
        description=f'Reversal of {original_reference_id}',
        entries=new_entries
    )
    
    # Mark original transaction as reversed (the trigger only allows status updates)
    orig_tx.status = 'reversed'
    orig_tx.save(update_fields=['status'])
    
    if actor:
        AuditLog.objects.create(
            actor=actor,
            action='REVERSAL',
            target_type='Transaction',
            target_identifier=str(original_reference_id),
            metadata={'new_reference_id': new_reference_id, 'ip_address': '0.0.0.0'}
        )
        
    return tx

@transaction.atomic
def check_idempotency(user, operation, idempotency_key, payload):
    """
    Returns (response_data, is_new)
    """
    payload_str = json.dumps(payload, sort_keys=True)
    payload_hash = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
    
    try:
        # Try to insert first with an atomic savepoint so Postgres doesn't abort the transaction on conflict
        with transaction.atomic():
            ik = IdempotencyKey.objects.create(
                user=user,
                operation=operation,
                idempotency_key=idempotency_key,
                payload_fingerprint=payload_hash
            )
            return None, True
    except IntegrityError:
        # It already exists - savepoint rolled back cleanly, so we can query safely
        ik = IdempotencyKey.objects.get(user=user, operation=operation, idempotency_key=idempotency_key)
        if ik.payload_fingerprint != payload_hash:
            raise FinancialError("Idempotency key reused with different payload")
        return ik.response_data, False

def complete_idempotency(user, operation, idempotency_key, response_data, reference=None):
    IdempotencyKey.objects.filter(
        user=user, operation=operation, idempotency_key=idempotency_key
    ).update(response_data=response_data, reference=reference)
