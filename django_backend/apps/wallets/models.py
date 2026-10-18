from django.db import models
from django.contrib.auth import get_user_model
import uuid
from decimal import Decimal
from django.core.validators import MinValueValidator

User = get_user_model()

class Balance(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    asset = models.CharField(max_length=20)
    account_type = models.CharField(max_length=50, default='spot')
    total = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0.00000000'))
    available = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0.00000000'))
    locked = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0.00000000'))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'balances'
        unique_together = (('user', 'asset', 'account_type'),)

class WithdrawalRequest(models.Model):
    id = models.AutoField(primary_key=True)
    withdrawal_uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    user = models.ForeignKey(User, on_delete=models.RESTRICT, db_column='user_id')
    asset = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=30, decimal_places=8, validators=[MinValueValidator(Decimal('0.00000001'))])
    address = models.TextField()
    network = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='pending')
    provider_txid = models.TextField(null=True, blank=True)
    idempotency_key = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'withdrawal_requests'
        unique_together = (('user', 'idempotency_key'),)
