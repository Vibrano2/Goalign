from decimal import Decimal
import logging
from apps.wallets.models import Balance

logger = logging.getLogger(__name__)

def ensure_starter_balances(user_id):
    """Initializes starter paper-trading balances for new users"""
    starter_assets = [
        ('USDT', Decimal('10000.00000000')),
        ('BTC', Decimal('0.50000000')),
        ('ETH', Decimal('5.00000000')),
        ('SOL', Decimal('20.00000000')),
    ]
    for asset, default_total in starter_assets:
        Balance.objects.get_or_create(
            user_id=user_id,
            asset=asset,
            account_type='spot',
            defaults={
                'total': default_total,
                'available': default_total,
                'locked': Decimal('0.00000000'),
            }
        )
