import uuid
from decimal import Decimal
import logging
from datetime import timedelta
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.db.models import F

from apps.authentication.models import GoalignAccount
from apps.wallets.models import Balance, WithdrawalRequest
from apps.wallets.views import resolve_goalign_account
from apps.ledger.services import post_ledger_transaction, lock_funds, consume_locked_funds, unlock_funds, InsufficientFunds
from .models import (
    Order, Trade, Position, OptionPosition,
    P2PAd, P2POrder, CopyAllocation, Stake, KYCApplication
)

logger = logging.getLogger(__name__)

VIP_TAKER_FEES = [Decimal('0.0010'), Decimal('0.0009'), Decimal('0.0008'), Decimal('0.0006'), Decimal('0.0004'), Decimal('0.0002')]

def get_live_price(symbol):
    """Fallback prices for paper trading and valuation"""
    prices = {
        'BTCUSDT': Decimal('68500.00'),
        'ETHUSDT': Decimal('3650.00'),
        'SOLUSDT': Decimal('180.00'),
        'DOGEUSDT': Decimal('0.16'),
        'XRPUSDT': Decimal('0.58'),
    }
    return prices.get(symbol.upper(), Decimal('100.00'))


# ==============================================================================
# SPOT TRADING VIEWS
# ==============================================================================
class TradeOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        symbol = request.data.get('symbol', '').upper()
        side = request.data.get('side', '').lower()
        order_type = request.data.get('type', 'market').lower()
        price_val = request.data.get('price')
        amount_val = request.data.get('amount')
        idempotency_key = request.data.get('idempotencyKey') or str(uuid.uuid4())

        if not user_id or not symbol or not side or not amount_val:
            return Response({'error': 'Missing required order parameters'}, status=status.HTTP_400_BAD_REQUEST)

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        quote_asset = 'USDT' if symbol.endswith('USDT') else 'USD'
        base_asset = symbol.replace(quote_asset, '')

        market_price = get_live_price(symbol)
        try:
            order_price = Decimal(str(price_val)) if (order_type == 'limit' and price_val) else market_price
            order_amount = Decimal(str(amount_val))
            if order_amount <= 0 or order_price <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'Invalid order amount or price'}, status=status.HTTP_400_BAD_REQUEST)

        # Asset to lock
        asset_to_lock = quote_asset if side == 'buy' else base_asset
        lock_amount = (order_amount * order_price) if side == 'buy' else order_amount

        fee_rate = VIP_TAKER_FEES[min(account.vip_level, 5)]

        try:
            with transaction.atomic():
                # 1. Check & Lock funds
                lock_funds(account, asset_to_lock, lock_amount, account_type='spot')

                # 2. Create Order
                order_status = 'closed' if order_type == 'market' else 'open'
                order = Order.objects.create(
                    user=account,
                    symbol=symbol,
                    side=side,
                    type=order_type,
                    price=order_price,
                    amount=order_amount,
                    filled=order_amount if order_type == 'market' else Decimal('0'),
                    status=order_status,
                    client_order_id=idempotency_key
                )

                # 3. If Market Order -> Settle immediately
                if order_type == 'market':
                    receive_asset = base_asset if side == 'buy' else quote_asset
                    receive_amount = order_amount if side == 'buy' else (order_amount * order_price)
                    fee_amount = receive_amount * fee_rate
                    net_receive = receive_amount - fee_amount

                    # Consume locked funds
                    consume_locked_funds(account, asset_to_lock, lock_amount, account_type='spot')

                    # Settle through double-entry ledger
                    post_ledger_transaction(
                        reference_id=f"TRD_ORDER_{order.id}",
                        transaction_type='SPOT_TRADE_SETTLEMENT',
                        description=f'Settlement for order #{order.id} ({side} {symbol})',
                        entries=[
                            {'user': account, 'account_type': 'spot', 'asset': receive_asset, 'direction': 'credit', 'amount': net_receive},
                            {'user': None, 'account_type': 'system_trading_pool', 'asset': receive_asset, 'direction': 'debit', 'amount': receive_amount},
                            {'user': None, 'account_type': 'system_fees', 'asset': receive_asset, 'direction': 'credit', 'amount': fee_amount},
                            {'user': None, 'account_type': 'system_clearing', 'asset': asset_to_lock, 'direction': 'debit', 'amount': lock_amount},
                            {'user': None, 'account_type': 'system_trading_pool', 'asset': asset_to_lock, 'direction': 'credit', 'amount': lock_amount}
                        ]
                    )

                    # Log Trade
                    Trade.objects.create(
                        order=order,
                        user=account,
                        symbol=symbol,
                        side=side,
                        price=order_price,
                        amount=order_amount,
                        fee=fee_amount,
                        fee_asset=receive_asset
                    )

            return Response({
                'message': 'Order placed successfully',
                'orderId': order.id,
                'status': 'executed' if order_type == 'market' else 'open'
            }, status=status.HTTP_200_OK)

        except InsufficientFunds:
            return Response({'error': f'Insufficient {asset_to_lock} available balance.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Order placement error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, firebase_uid=None):
        uid = firebase_uid or request.query_params.get('userId')
        account = resolve_goalign_account(uid)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        orders = Order.objects.filter(user_id=account.id).order_by('-created_at')[:50]
        data = [
            {
                'id': o.id,
                'symbol': o.symbol,
                'side': o.side,
                'type': o.type,
                'price': str(o.price),
                'amount': str(o.amount),
                'filled': str(o.filled),
                'status': o.status,
                'created_at': o.created_at.isoformat() if o.created_at else None
            }
            for o in orders
        ]
        return Response({'orders': data}, status=status.HTTP_200_OK)


# ==============================================================================
# FUTURES TRADING VIEWS
# ==============================================================================
class FuturesOpenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        symbol = request.data.get('symbol', '').upper()
        side = request.data.get('side', '').lower()
        leverage = int(request.data.get('leverage', 10))
        margin_val = request.data.get('margin')

        if not user_id or not symbol or not side or not margin_val:
            return Response({'error': 'Missing required parameters'}, status=status.HTTP_400_BAD_REQUEST)

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            margin = Decimal(str(margin_val))
            if margin <= 0 or leverage < 1 or leverage > 125:
                raise ValueError()
        except Exception:
            return Response({'error': 'Invalid margin or leverage'}, status=status.HTTP_400_BAD_REQUEST)

        quote_asset = 'USDT' if symbol.endswith('USDT') else 'USD'
        entry_price = get_live_price(symbol)
        size = margin * leverage

        margin_ratio = Decimal('1') / Decimal(str(leverage))
        buffer_val = Decimal('0.005')
        if side == 'long':
            liq_price = entry_price * (Decimal('1') - margin_ratio + buffer_val)
        else:
            liq_price = entry_price * (Decimal('1') + margin_ratio - buffer_val)

        try:
            with transaction.atomic():
                lock_funds(account, quote_asset, margin, account_type='futures')

                pos = Position.objects.create(
                    user=account,
                    symbol=symbol,
                    side=side,
                    leverage=leverage,
                    margin=margin,
                    entry_price=entry_price,
                    size=size,
                    liquidation_price=liq_price,
                    status='open'
                )

            return Response({
                'message': 'Position opened',
                'positionId': pos.id,
                'isPaperTrading': True
            }, status=status.HTTP_200_OK)

        except InsufficientFunds:
            return Response({'error': f'Insufficient {quote_asset} in Futures wallet. Transfer funds to futures.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FuturesPositionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        positions = Position.objects.filter(user_id=account.id, status='open').order_by('-created_at')
        data = [
            {
                'id': p.id,
                'symbol': p.symbol,
                'side': p.side,
                'leverage': p.leverage,
                'margin': str(p.margin),
                'entry_price': str(p.entry_price),
                'size': str(p.size),
                'liquidation_price': str(p.liquidation_price),
                'status': p.status,
                'created_at': p.created_at.isoformat() if p.created_at else None
            }
            for p in positions
        ]
        return Response({'positions': data}, status=status.HTTP_200_OK)


class FuturesCloseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        pos_id = request.data.get('position_id')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                pos = Position.objects.select_for_update().get(id=pos_id, user_id=account.id, status='open')
                current_price = get_live_price(pos.symbol)

                if pos.side == 'long':
                    pnl = ((current_price - pos.entry_price) / pos.entry_price) * pos.size
                else:
                    pnl = ((pos.entry_price - current_price) / pos.entry_price) * pos.size

                quote_asset = 'USDT' if pos.symbol.endswith('USDT') else 'USD'

                # Unlock original margin
                unlock_funds(account, quote_asset, pos.margin, account_type='futures')

                # Apply PnL via Ledger
                if pnl > 0:
                    post_ledger_transaction(
                        reference_id=f"FUT_PNL_{pos.id}",
                        transaction_type='FUTURES_CLOSE_PROFIT',
                        description=f'Futures profit for pos #{pos.id}',
                        entries=[
                            {'user': account, 'account_type': 'futures', 'asset': quote_asset, 'direction': 'credit', 'amount': pnl},
                            {'user': None, 'account_type': 'system_trading_pool', 'asset': quote_asset, 'direction': 'debit', 'amount': pnl}
                        ]
                    )
                elif pnl < 0:
                    loss = abs(pnl)
                    post_ledger_transaction(
                        reference_id=f"FUT_PNL_{pos.id}",
                        transaction_type='FUTURES_CLOSE_LOSS',
                        description=f'Futures loss for pos #{pos.id}',
                        entries=[
                            {'user': account, 'account_type': 'futures', 'asset': quote_asset, 'direction': 'debit', 'amount': min(loss, pos.margin)},
                            {'user': None, 'account_type': 'system_trading_pool', 'asset': quote_asset, 'direction': 'credit', 'amount': min(loss, pos.margin)}
                        ]
                    )

                pos.status = 'closed'
                pos.save()

            return Response({
                'message': 'Position closed successfully',
                'closePrice': str(current_price),
                'pnl': str(pnl)
            }, status=status.HTTP_200_OK)

        except Position.DoesNotExist:
            return Response({'error': 'Position not found or already closed'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# OPTIONS TRADING VIEWS
# ==============================================================================
class OptionsChainView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, symbol):
        symbol = symbol.upper()
        mark_price = float(get_live_price(symbol))
        step = 1000 if 'BTC' in symbol else 100
        base_strike = round(mark_price / step) * step

        strikes = [base_strike + (i * step) for i in range(-5, 6)]

        def calc_premium(strike, opt_type):
            dist = abs(strike - mark_price)
            itm = max(0, mark_price - strike) if opt_type == 'call' else max(0, strike - mark_price)
            time_val = max(10, (step * 2) - (dist * 0.5))
            prem = itm + time_val
            spread = prem * 0.02
            return {
                'bid': max(0.1, round(prem - spread, 2)),
                'ask': max(0.1, round(prem + spread, 2)),
                'mark': max(0.1, round(prem, 2))
            }

        chain = [
            {'strike': s, 'call': calc_premium(s, 'call'), 'put': calc_premium(s, 'put')}
            for s in strikes
        ]
        return Response({'symbol': symbol, 'markPrice': mark_price, 'chain': chain}, status=status.HTTP_200_OK)


class OptionsTradeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        symbol = request.data.get('symbol', '').upper()
        opt_type = request.data.get('type', 'call').lower()
        strike_price_val = request.data.get('strike_price')
        size_val = request.data.get('size')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            strike_price = Decimal(str(strike_price_val))
            size = Decimal(str(size_val))
            premium = Decimal('50.00') * size
        except Exception:
            return Response({'error': 'Invalid trade values'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                post_ledger_transaction(
                    reference_id=f"OPT_{uuid.uuid4().hex[:12]}",
                    transaction_type='OPTION_BUY_PREMIUM',
                    description=f'Bought {size} {opt_type.upper()} on {symbol} @ strike {strike_price}',
                    entries=[
                        {'user': account, 'account_type': 'spot', 'asset': 'USDT', 'direction': 'debit', 'amount': premium},
                        {'user': None, 'account_type': 'system_fees', 'asset': 'USDT', 'direction': 'credit', 'amount': premium}
                    ]
                )
                pos = OptionPosition.objects.create(
                    user=account,
                    symbol=symbol,
                    type=opt_type,
                    side='buy',
                    strike_price=strike_price,
                    premium_paid=premium,
                    size=size,
                    expiry_date=timezone.now() + timedelta(days=7),
                    status='open'
                )

            return Response({'message': 'Option purchased successfully', 'positionId': pos.id}, status=status.HTTP_200_OK)
        except InsufficientFunds:
            return Response({'error': 'Insufficient USDT balance for option premium'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OptionsPositionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        positions = OptionPosition.objects.filter(user_id=account.id, status='open').order_by('-created_at')
        data = [
            {
                'id': p.id,
                'symbol': p.symbol,
                'type': p.type,
                'strike_price': str(p.strike_price),
                'premium_paid': str(p.premium_paid),
                'size': str(p.size),
                'expiry_date': p.expiry_date.isoformat() if p.expiry_date else None,
                'status': p.status
            }
            for p in positions
        ]
        return Response({'positions': data}, status=status.HTTP_200_OK)


# ==============================================================================
# P2P MARKETPLACE VIEWS
# ==============================================================================
class P2PSeedView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if P2PAd.objects.count() > 0:
            return Response({'message': 'P2P ads already exist'}, status=status.HTTP_200_OK)

        merchant = GoalignAccount.objects.first()
        if not merchant:
            return Response({'error': 'No users available for merchant creation'}, status=status.HTTP_400_BAD_REQUEST)

        mock_ads = [
            {'type': 'sell', 'asset': 'USDT', 'fiat': 'USD', 'price': Decimal('1.01'), 'available': Decimal('15000'), 'min': Decimal('100'), 'max': Decimal('5000'), 'methods': ['Bank Transfer', 'Zelle']},
            {'type': 'sell', 'asset': 'USDT', 'fiat': 'USD', 'price': Decimal('1.02'), 'available': Decimal('5000'), 'min': Decimal('50'), 'max': Decimal('2000'), 'methods': ['PayPal', 'Venmo']},
            {'type': 'buy', 'asset': 'USDT', 'fiat': 'USD', 'price': Decimal('0.99'), 'available': Decimal('50000'), 'min': Decimal('500'), 'max': Decimal('20000'), 'methods': ['Bank Transfer', 'Cash App']},
        ]
        for ad_data in mock_ads:
            P2PAd.objects.create(
                user=merchant,
                type=ad_data['type'],
                asset=ad_data['asset'],
                fiat=ad_data['fiat'],
                price=ad_data['price'],
                total_amount=ad_data['available'],
                available_amount=ad_data['available'],
                min_limit=ad_data['min'],
                max_limit=ad_data['max'],
                payment_methods=ad_data['methods'],
                status='active'
            )
        return Response({'message': 'P2P mock ads seeded successfully'}, status=status.HTTP_200_OK)


class P2PAdsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ad_type = request.query_params.get('type')
        asset = request.query_params.get('asset')
        fiat = request.query_params.get('fiat')

        qs = P2PAd.objects.filter(status='active').order_by('price')
        if ad_type:
            qs = qs.filter(type=ad_type)
        if asset:
            qs = qs.filter(asset=asset.upper())
        if fiat:
            qs = qs.filter(fiat=fiat.upper())

        ads = [
            {
                'id': a.id,
                'type': a.type,
                'asset': a.asset,
                'fiat': a.fiat,
                'price': str(a.price),
                'available_amount': str(a.available_amount),
                'min_limit': str(a.min_limit),
                'max_limit': str(a.max_limit),
                'payment_methods': a.payment_methods,
                'merchant_name': a.user.display_name or a.user.email
            }
            for a in qs
        ]
        return Response({'ads': ads}, status=status.HTTP_200_OK)


class P2POrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        ad_id = request.data.get('ad_id')
        crypto_amount_val = request.data.get('crypto_amount')
        payment_method = request.data.get('payment_method', 'Bank Transfer')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            ad = P2PAd.objects.get(id=ad_id, status='active')
            crypto_amount = Decimal(str(crypto_amount_val))
            fiat_amount = crypto_amount * ad.price
        except Exception:
            return Response({'error': 'Invalid ad or order amount'}, status=status.HTTP_400_BAD_REQUEST)

        order = P2POrder.objects.create(
            ad=ad,
            buyer=account if ad.type == 'sell' else ad.user,
            seller=ad.user if ad.type == 'sell' else account,
            asset=ad.asset,
            fiat=ad.fiat,
            crypto_amount=crypto_amount,
            fiat_amount=fiat_amount,
            price=ad.price,
            status='pending',
            payment_method=payment_method
        )
        return Response({'message': 'P2P Order initiated', 'orderId': order.id, 'status': 'pending'}, status=status.HTTP_200_OK)

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        orders = P2POrder.objects.filter(buyer_id=account.id).order_by('-created_at') | P2POrder.objects.filter(seller_id=account.id).order_by('-created_at')
        data = [
            {
                'id': o.id,
                'asset': o.asset,
                'fiat': o.fiat,
                'crypto_amount': str(o.crypto_amount),
                'fiat_amount': str(o.fiat_amount),
                'price': str(o.price),
                'status': o.status,
                'payment_method': o.payment_method,
                'created_at': o.created_at.isoformat() if o.created_at else None
            }
            for o in orders[:50]
        ]
        return Response({'orders': data}, status=status.HTTP_200_OK)


# ==============================================================================
# COPY TRADING VIEWS
# ==============================================================================
class CopyTradingMastersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        masters = [
            {'name': 'Alpha Whale', 'roi': '+148.5%', 'win_rate': '82%', 'copiers': 1420, 'assets': ['BTC', 'ETH'], 'risk': 'Moderate'},
            {'name': 'Solana Sniper', 'roi': '+234.1%', 'win_rate': '76%', 'copiers': 980, 'assets': ['SOL', 'JUP'], 'risk': 'High'},
            {'name': 'Delta Neutral Bot', 'roi': '+45.2%', 'win_rate': '94%', 'copiers': 3100, 'assets': ['USDT', 'BTC'], 'risk': 'Low'},
        ]
        return Response({'masters': masters}, status=status.HTTP_200_OK)


class CopyTradingAllocationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'allocations': []}, status=status.HTTP_200_OK)

        allocs = CopyAllocation.objects.filter(user_id=account.id, status='active')
        data = [
            {
                'id': a.id,
                'master_name': a.master_name,
                'allocated_amount': str(a.allocated_amount),
                'current_value': str(a.current_value),
                'status': a.status
            }
            for a in allocs
        ]
        return Response({'allocations': data}, status=status.HTTP_200_OK)


class CopyTradingCopyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        master_name = request.data.get('master_name')
        amount_val = request.data.get('amount')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = Decimal(str(amount_val))
            if amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'Invalid allocation amount'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                lock_funds(account, 'USDT', amount, account_type='spot')
                alloc = CopyAllocation.objects.create(
                    user=account,
                    master_name=master_name,
                    allocated_amount=amount,
                    current_value=amount,
                    status='active'
                )
            return Response({'message': f'Now copying {master_name}', 'allocationId': alloc.id}, status=status.HTTP_200_OK)
        except InsufficientFunds:
            return Response({'error': 'Insufficient USDT in spot balance'}, status=status.HTTP_400_BAD_REQUEST)


class CopyTradingStopView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        alloc_id = request.data.get('allocation_id')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                alloc = CopyAllocation.objects.select_for_update().get(id=alloc_id, user_id=account.id, status='active')
                unlock_funds(account, 'USDT', alloc.allocated_amount, account_type='spot')
                alloc.status = 'stopped'
                alloc.save()
            return Response({'message': 'Stopped copying master trader'}, status=status.HTTP_200_OK)
        except CopyAllocation.DoesNotExist:
            return Response({'error': 'Allocation not found or already stopped'}, status=status.HTTP_404_NOT_FOUND)


# ==============================================================================
# EARN & STAKING VIEWS
# ==============================================================================
class EarnSubscribeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        asset = request.data.get('asset', 'USDT').upper()
        amount_val = request.data.get('amount')
        apy_val = request.data.get('apy', '8.5')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = Decimal(str(amount_val))
            apy = Decimal(str(apy_val))
            if amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'Invalid staking amount'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                lock_funds(account, asset, amount, account_type='spot')
                stake = Stake.objects.create(
                    user=account,
                    asset=asset,
                    amount=amount,
                    apy=apy,
                    status='active'
                )
            return Response({'message': 'Staked successfully', 'stakeId': stake.id}, status=status.HTTP_200_OK)
        except InsufficientFunds:
            return Response({'error': f'Insufficient {asset} available in spot wallet'}, status=status.HTTP_400_BAD_REQUEST)


class EarnSubscriptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'subscriptions': []}, status=status.HTTP_200_OK)

        stakes = Stake.objects.filter(user_id=account.id, status='active')
        data = [
            {
                'id': s.id,
                'asset': s.asset,
                'amount': str(s.amount),
                'apy': str(s.apy),
                'status': s.status,
                'created_at': s.created_at.isoformat() if s.created_at else None
            }
            for s in stakes
        ]
        return Response({'subscriptions': data}, status=status.HTTP_200_OK)


class EarnRedeemView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        stake_id = request.data.get('stake_id')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                stake = Stake.objects.select_for_update().get(id=stake_id, user_id=account.id, status='active')
                unlock_funds(account, stake.asset, stake.amount, account_type='spot')
                stake.status = 'redeemed'
                stake.redeemed_at = timezone.now()
                stake.save()
            return Response({'message': 'Earn stake redeemed successfully'}, status=status.HTTP_200_OK)
        except Stake.DoesNotExist:
            return Response({'error': 'Stake not found or already redeemed'}, status=status.HTTP_404_NOT_FOUND)


# ==============================================================================
# INVEST / QUANTIFY VIEWS
# ==============================================================================
QUANTIFY_PLANS = [
    {'id': 1, 'title': 'USDT Arbitrage 1 day quantitative trading', 'days': 1, 'dailyInterest': 0.28, 'min': 10, 'max': 100, 'soldOut': 12},
    {'id': 2, 'title': 'USDT Arbitrage 2 days quantitative trading', 'days': 2, 'dailyInterest': 0.35, 'min': 100, 'max': 500, 'soldOut': 45},
    {'id': 3, 'title': 'USDT Arbitrage 30 days quantitative trading', 'days': 30, 'dailyInterest': 0.50, 'min': 500, 'max': 1000, 'soldOut': 78},
    {'id': 4, 'title': 'USDT Arbitrage 90 days quantitative trading', 'days': 90, 'dailyInterest': 0.80, 'min': 1000, 'max': 5000, 'soldOut': 89},
    {'id': 5, 'title': 'USDT Arbitrage 180 days quantitative trading', 'days': 180, 'dailyInterest': 1.20, 'min': 5000, 'max': 10000, 'soldOut': 95},
    {'id': 6, 'title': 'USDT Arbitrage 360 days quantitative trading', 'days': 360, 'dailyInterest': 2.00, 'min': 10000, 'max': 50000, 'soldOut': 98},
]


class InvestQuantifyPlansView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'plans': QUANTIFY_PLANS}, status=status.HTTP_200_OK)


class InvestQuantifyBuyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        firebase_uid = request.data.get('firebaseUid') or request.data.get('user_id') or request.data.get('userId')
        plan_id = request.data.get('planId')
        amount_val = request.data.get('amount')

        if not firebase_uid or plan_id is None or amount_val is None:
            return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)

        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        plan = next((p for p in QUANTIFY_PLANS if p['id'] == int(plan_id)), None)
        if not plan:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            purchase_amount = Decimal(str(amount_val))
            if purchase_amount < Decimal(str(plan['min'])) or purchase_amount > Decimal(str(plan['max'])):
                return Response({'error': f"Amount must be between {plan['min']} and {plan['max']} USDT"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        annual_apy = (Decimal(str(plan['dailyInterest'])) * Decimal('365')) / Decimal('100')

        try:
            with transaction.atomic():
                lock_funds(account, 'USDT', purchase_amount, account_type='spot')
                Stake.objects.create(
                    user=account,
                    asset='USDT',
                    amount=purchase_amount,
                    apy=annual_apy,
                    status='active'
                )
            return Response({'message': f"Successfully purchased {plan['title']}"}, status=status.HTTP_200_OK)
        except InsufficientFunds:
            return Response({'error': 'Insufficient USDT balance'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InvestPledgesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'pledges': []}, status=status.HTTP_200_OK)

        stakes = Stake.objects.filter(user_id=account.id, status='active').order_by('-created_at')
        now = timezone.now()
        pledges_data = []
        for s in stakes:
            c_at = s.created_at
            seconds_elapsed = Decimal(str((now - c_at).total_seconds()))
            years_elapsed = seconds_elapsed / Decimal(str(365 * 24 * 3600))
            principal = Decimal(str(s.amount))
            apy = Decimal(str(s.apy))
            earned = principal * apy * years_elapsed
            pledges_data.append({
                'id': s.id,
                'user_id': s.user_id,
                'asset': s.asset,
                'amount': str(s.amount),
                'apy': str(s.apy),
                'status': s.status,
                'created_at': s.created_at.isoformat() if s.created_at else None,
                'earned': f'{earned:.8f}'
            })
        return Response({'pledges': pledges_data}, status=status.HTTP_200_OK)


class InvestPledgeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId') or request.data.get('firebaseUid')
        asset = (request.data.get('asset') or 'USDT').upper()
        amount_val = request.data.get('amount')

        if not user_id or not amount_val:
            return Response({'error': 'Invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            pledge_amount = Decimal(str(amount_val))
            if pledge_amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        rates = {'USDT': Decimal('0.18'), 'BTC': Decimal('0.08'), 'ETH': Decimal('0.06')}
        apy = rates.get(asset, Decimal('0.05'))

        try:
            with transaction.atomic():
                lock_funds(account, asset, pledge_amount, account_type='spot')
                Stake.objects.create(
                    user=account,
                    asset=asset,
                    amount=pledge_amount,
                    apy=apy,
                    status='active'
                )
            return Response({'message': 'Pledged successfully'}, status=status.HTTP_200_OK)
        except InsufficientFunds:
            return Response({'error': f'Insufficient {asset} in Spot wallet to pledge'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InvestRedeemView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId') or request.data.get('firebaseUid')
        stake_id = request.data.get('stake_id')

        if not user_id or not stake_id:
            return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                stake = Stake.objects.select_for_update().get(id=stake_id, user_id=account.id, status='active')
                now = timezone.now()
                c_at = stake.created_at
                years_elapsed = Decimal(str((now - c_at).total_seconds())) / Decimal(str(365 * 24 * 3600))
                principal = Decimal(str(stake.amount))
                apy = Decimal(str(stake.apy))
                earned = principal * apy * years_elapsed

                unlock_funds(account, stake.asset, principal, account_type='spot')
                bal, _ = Balance.objects.select_for_update().get_or_create(
                    user_id=account.id,
                    asset=stake.asset,
                    account_type='spot',
                    defaults={'available': Decimal('0'), 'locked': Decimal('0'), 'total': Decimal('0')}
                )
                bal.available += earned
                bal.total += earned
                bal.save()

                stake.status = 'redeemed'
                stake.redeemed_at = timezone.now()
                stake.save()

            return Response({
                'message': 'Redeemed successfully',
                'principal': str(principal),
                'earned': f'{earned:.8f}'
            }, status=status.HTTP_200_OK)
        except Stake.DoesNotExist:
            return Response({'error': 'Pledge not found or already redeemed'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# KYC & VIP VIEWS
# ==============================================================================
class KYCStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        if not account:
            return Response({'status': 'unverified'}, status=status.HTTP_200_OK)
        return Response({'status': account.kyc_status}, status=status.HTTP_200_OK)


class KYCRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId') or request.data.get('firebaseUid')
        full_name = request.data.get('full_name') or request.data.get('fullName')
        dob = request.data.get('date_of_birth') or request.data.get('dob') or '2000-01-01'
        address = request.data.get('address', 'N/A')
        id_doc = request.data.get('id_document') or request.data.get('idDocument') or 'base64_doc_placeholder'

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        KYCApplication.objects.update_or_create(
            user=account,
            defaults={
                'full_name': full_name or account.display_name or 'Verified User',
                'date_of_birth': dob,
                'address': address,
                'id_document_base64': id_doc
            }
        )
        account.kyc_status = 'pending'
        account.save()

        return Response({'message': 'KYC submission received and is under review', 'status': 'pending'}, status=status.HTTP_200_OK)


class VIPStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, firebase_uid):
        account = resolve_goalign_account(firebase_uid)
        vip_level = account.vip_level if account else 0
        fee_rate = str(VIP_TAKER_FEES[min(vip_level, 5)])
        return Response({'vip_level': vip_level, 'taker_fee_rate': fee_rate}, status=status.HTTP_200_OK)


class VIPUpgradeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        target_level = int(request.data.get('target_level', 1))

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        account.vip_level = min(target_level, 5)
        account.save()
        return Response({'message': f'Upgraded to VIP Level {account.vip_level}', 'vip_level': account.vip_level}, status=status.HTTP_200_OK)


# ==============================================================================
# BACKOFFICE ADMIN APIs
# ==============================================================================
class AdminUsersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        accounts = GoalignAccount.objects.all().order_by('-created_at')[:100]
        data = [
            {
                'id': a.id,
                'email': a.email,
                'display_name': a.display_name,
                'vip_level': a.vip_level,
                'is_admin': a.is_admin,
                'kyc_status': a.kyc_status,
                'web3_eth_address': a.web3_eth_address,
                'created_at': a.created_at.isoformat() if a.created_at else None
            }
            for a in accounts
        ]
        return Response({'users': data}, status=status.HTTP_200_OK)


class AdminWithdrawalsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        wds = WithdrawalRequest.objects.all().order_by('-created_at')[:100]
        data = [
            {
                'withdrawal_uuid': str(w.withdrawal_uuid),
                'user_id': w.user_id,
                'asset': w.asset,
                'amount': str(w.amount),
                'address': w.address,
                'network': w.network,
                'status': w.status,
                'provider_txid': w.provider_txid,
                'created_at': w.created_at.isoformat() if w.created_at else None
            }
            for w in wds
        ]
        return Response({'withdrawals': data}, status=status.HTTP_200_OK)


class AdminWithdrawalActionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uuid, action):
        wd = WithdrawalRequest.objects.filter(withdrawal_uuid=uuid).first()
        if not wd:
            return Response({'error': 'Withdrawal request not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            wd.status = 'completed'
            wd.provider_txid = f"tx_{uuid[:16]}"
            wd.save()
            return Response({'message': 'Withdrawal approved', 'status': 'completed'}, status=status.HTTP_200_OK)

        elif action == 'reject':
            with transaction.atomic():
                wd.status = 'rejected'
                wd.save()
                # Refund user balance via Ledger
                post_ledger_transaction(
                    reference_id=f"WD_REFUND_{uuid}",
                    transaction_type='WITHDRAWAL_REJECT_REFUND',
                    description=f'Refund for rejected withdrawal {uuid}',
                    entries=[
                        {'user': wd.user_id, 'account_type': 'spot', 'asset': wd.asset, 'direction': 'credit', 'amount': wd.amount},
                        {'user': None, 'account_type': 'system_withdrawals', 'asset': wd.asset, 'direction': 'debit', 'amount': wd.amount}
                    ]
                )
            return Response({'message': 'Withdrawal rejected and funds refunded to user spot wallet', 'status': 'rejected'}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class AdminFundUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, userId):
        account = resolve_goalign_account(userId)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        asset = request.data.get('asset', 'USDT').upper()
        amount = Decimal(str(request.data.get('amount', '1000')))

        post_ledger_transaction(
            reference_id=f"ADMIN_FUND_{uuid.uuid4().hex[:12]}",
            transaction_type='ADMIN_MANUAL_CREDIT',
            description=f'Admin manual funding for {account.email}',
            entries=[
                {'user': account, 'account_type': 'spot', 'asset': asset, 'direction': 'credit', 'amount': amount},
                {'user': None, 'account_type': 'system_deposits', 'asset': asset, 'direction': 'debit', 'amount': amount}
            ]
        )
        return Response({'message': f'Successfully credited {amount} {asset} to user'}, status=status.HTTP_200_OK)


class AdminUserUpdateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, userId, field):
        account = resolve_goalign_account(userId)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if field == 'vip':
            account.vip_level = int(request.data.get('vip_level', 0))
            account.save()
            return Response({'message': f'VIP updated to {account.vip_level}'}, status=status.HTTP_200_OK)
        elif field == 'kyc':
            account.kyc_status = request.data.get('kyc_status', 'verified')
            account.save()
            return Response({'message': f'KYC status updated to {account.kyc_status}'}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid field'}, status=status.HTTP_400_BAD_REQUEST)
