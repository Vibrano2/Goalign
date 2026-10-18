from django.db import models
from django.contrib.postgres.fields import ArrayField
from apps.authentication.models import GoalignAccount

class Order(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    symbol = models.CharField(max_length=20)
    side = models.CharField(max_length=10) # 'buy' | 'sell'
    type = models.CharField(max_length=20) # 'limit' | 'market'
    price = models.DecimalField(max_digits=30, decimal_places=8)
    amount = models.DecimalField(max_digits=30, decimal_places=8)
    filled = models.DecimalField(max_digits=30, decimal_places=8, default=0)
    status = models.CharField(max_length=20, default='open') # 'open', 'closed', 'canceled'
    client_order_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'orders'

    def __str__(self):
        return f"Order #{self.id} {self.side.upper()} {self.amount} {self.symbol} @ {self.price}"


class Trade(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, db_column='order_id')
    user = models.ForeignKey(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    symbol = models.CharField(max_length=20)
    side = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=30, decimal_places=8)
    amount = models.DecimalField(max_digits=30, decimal_places=8)
    fee = models.DecimalField(max_digits=30, decimal_places=8, default=0)
    fee_asset = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'trades'

    def __str__(self):
        return f"Trade #{self.id} {self.side.upper()} {self.amount} {self.symbol} @ {self.price}"


class Position(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    symbol = models.CharField(max_length=20)
    side = models.CharField(max_length=10) # 'long' | 'short'
    leverage = models.IntegerField()
    margin = models.DecimalField(max_digits=30, decimal_places=8)
    entry_price = models.DecimalField(max_digits=30, decimal_places=8)
    size = models.DecimalField(max_digits=30, decimal_places=8)
    liquidation_price = models.DecimalField(max_digits=30, decimal_places=8)
    status = models.CharField(max_length=20, default='open') # 'open', 'closed', 'liquidated', 'open_paper'
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'positions'

    def __str__(self):
        return f"Position #{self.id} {self.side.upper()} {self.symbol} {self.leverage}x"


class OptionPosition(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    symbol = models.CharField(max_length=20)
    type = models.CharField(max_length=10) # 'call' | 'put'
    side = models.CharField(max_length=10) # 'buy' | 'sell'
    strike_price = models.DecimalField(max_digits=30, decimal_places=8)
    premium_paid = models.DecimalField(max_digits=30, decimal_places=8)
    size = models.DecimalField(max_digits=30, decimal_places=8)
    expiry_date = models.DateTimeField()
    status = models.CharField(max_length=20, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'options_positions'

    def __str__(self):
        return f"Option #{self.id} {self.type.upper()} {self.symbol} Strike:{self.strike_price}"


class P2PAd(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    type = models.CharField(max_length=10) # 'buy' | 'sell'
    asset = models.CharField(max_length=20)
    fiat = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=30, decimal_places=8)
    total_amount = models.DecimalField(max_digits=30, decimal_places=8)
    available_amount = models.DecimalField(max_digits=30, decimal_places=8)
    min_limit = models.DecimalField(max_digits=30, decimal_places=8)
    max_limit = models.DecimalField(max_digits=30, decimal_places=8)
    payment_methods = ArrayField(models.CharField(max_length=100), default=list)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'p2p_ads'

    def __str__(self):
        return f"P2P Ad #{self.id} {self.type.upper()} {self.asset} for {self.fiat}"


class P2POrder(models.Model):
    id = models.AutoField(primary_key=True)
    ad = models.ForeignKey(P2PAd, on_delete=models.CASCADE, db_column='ad_id')
    buyer = models.ForeignKey(GoalignAccount, on_delete=models.SET_NULL, null=True, related_name='p2p_buys', db_column='buyer_id')
    seller = models.ForeignKey(GoalignAccount, on_delete=models.SET_NULL, null=True, related_name='p2p_sells', db_column='seller_id')
    asset = models.CharField(max_length=20)
    fiat = models.CharField(max_length=10)
    crypto_amount = models.DecimalField(max_digits=30, decimal_places=8)
    fiat_amount = models.DecimalField(max_digits=30, decimal_places=8)
    price = models.DecimalField(max_digits=30, decimal_places=8)
    status = models.CharField(max_length=20, default='pending')
    payment_method = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'p2p_orders'

    def __str__(self):
        return f"P2P Order #{self.id} {self.crypto_amount} {self.asset} ({self.status})"


class CopyAllocation(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    master_name = models.CharField(max_length=100)
    allocated_amount = models.DecimalField(max_digits=30, decimal_places=8)
    current_value = models.DecimalField(max_digits=30, decimal_places=8)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'copy_allocations'

    def __str__(self):
        return f"Copy #{self.id} {self.master_name} ({self.status})"


class Stake(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    asset = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=30, decimal_places=8)
    apy = models.DecimalField(max_digits=10, decimal_places=4)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'stakes'

    def __str__(self):
        return f"Stake #{self.id} {self.amount} {self.asset} @ {self.apy}%"


class KYCApplication(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(GoalignAccount, on_delete=models.CASCADE, db_column='user_id')
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    address = models.TextField()
    id_type = models.CharField(max_length=50, default='ID Card')
    id_document_base64 = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'kyc_applications'

    def __str__(self):
        return f"KYC for {self.full_name} ({self.user.email})"
