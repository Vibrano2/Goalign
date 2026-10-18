from django.db import models
from django.contrib.auth import get_user_model
import uuid
from decimal import Decimal
from django.core.validators import MinValueValidator

User = get_user_model()

class LedgerTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    transaction_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='completed')
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'ledger_transactions'

class LedgerEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ledger_transaction = models.ForeignKey(LedgerTransaction, on_delete=models.RESTRICT, db_column='ledger_transaction_id')
    user = models.ForeignKey(User, on_delete=models.RESTRICT, db_column='user_id', null=True, blank=True)
    account_type = models.CharField(max_length=50, default='spot')
    asset = models.CharField(max_length=20)
    direction = models.CharField(max_length=10) # 'debit' or 'credit'
    amount = models.DecimalField(max_digits=30, decimal_places=8, validators=[MinValueValidator(Decimal('0.00000001'))])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'ledger_entries'

class IdempotencyKey(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    operation = models.CharField(max_length=100)
    idempotency_key = models.CharField(max_length=255)
    payload_fingerprint = models.CharField(max_length=64)
    response_data = models.JSONField(null=True, blank=True)
    reference = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'idempotency_keys'
        unique_together = (('user', 'operation', 'idempotency_key'),)
