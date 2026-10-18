import uuid
from decimal import Decimal
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db import transaction

from apps.wallets.models import Balance, WithdrawalRequest
from apps.authentication.models import GoalignAccount
from apps.authentication.services import ensure_starter_balances
from apps.ledger.services import post_ledger_transaction, FinancialError, InsufficientFunds

logger = logging.getLogger(__name__)


def resolve_goalign_account(user_identifier):
    """Resolves a GoalignAccount by integer ID or firebase_uid string, auto-provisioning if missing"""
    if not user_identifier:
        return None
    try:
        if str(user_identifier).isdigit():
            return GoalignAccount.objects.get(id=int(user_identifier))
        return GoalignAccount.objects.get(firebase_uid=str(user_identifier))
    except GoalignAccount.DoesNotExist:
        try:
            account = GoalignAccount.objects.create(
                firebase_uid=str(user_identifier),
                email=f"{str(user_identifier)[:10]}@goalign.com",
                display_name="Trader",
                vip_level=0,
                kyc_status="unverified"
            )
            ensure_starter_balances(account.id)
            return account
        except Exception as e:
            logger.error(f"Auto-provision account error: {e}")
            return None


class BalancesView(APIView):
    """
    GET /api/wallet/balances/<user_id>
    Returns all balances for a specific user (by internal ID or firebase_uid).
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Ensure starter balances exist
        balances = list(Balance.objects.filter(user_id=account.id).order_by('asset'))
        if not balances:
            ensure_starter_balances(account.id)
            balances = list(Balance.objects.filter(user_id=account.id).order_by('asset'))

        data = [
            {
                'asset': b.asset,
                'account_type': b.account_type,
                'total': str(b.total),
                'available': str(b.available),
                'locked': str(b.locked)
            }
            for b in balances
        ]
        return Response({'balances': data}, status=status.HTTP_200_OK)


class DepositAddressView(APIView):
    """
    GET /api/wallet/deposit-address?coin=USDT&network=TRC20
    Returns a deposit address for the requested asset and network.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        coin = request.query_params.get('coin')
        network = request.query_params.get('network')

        if not coin or not network:
            return Response(
                {'error': 'Missing coin or network parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generates deterministic mock deposit address for dev/testing
        deterministic_hash = abs(hash(f"{coin}_{network}")) % 100000000
        mock_addr = f"0x{deterministic_hash:08x}{coin.upper()}{network.upper()}"
        return Response({'address': mock_addr}, status=status.HTTP_200_OK)


class DepositView(APIView):
    """
    POST /api/wallet/deposit
    Processes a deposit via the double-entry Ledger system.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        asset = request.data.get('asset')
        amount_val = request.data.get('amount')
        txid = request.data.get('txid') or f"tx_{uuid.uuid4().hex[:12]}"
        account_type = request.data.get('account_type', 'spot')

        if not user_id or not asset or not amount_val:
            return Response({'error': 'Missing required deposit parameters'}, status=status.HTTP_400_BAD_REQUEST)

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = Decimal(str(amount_val))
            if amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'Deposit amount must be a positive number'}, status=status.HTTP_400_BAD_REQUEST)

        reference_id = f"deposit_{txid}"

        try:
            post_ledger_transaction(
                reference_id=reference_id,
                transaction_type='MOCK_DEPOSIT',
                description=f'Deposit of {amount} {asset.upper()}',
                entries=[
                    {'user': account, 'account_type': account_type, 'asset': asset, 'direction': 'credit', 'amount': amount},
                    {'user': None, 'account_type': 'system_deposits', 'asset': asset, 'direction': 'debit', 'amount': amount}
                ]
            )
            return Response({'message': 'Deposit successful', 'txid': txid}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Deposit ledger error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WithdrawView(APIView):
    """
    POST /api/wallet/withdraw
    Creates a withdrawal request and reserves funds via Ledger.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('userId')
        asset = request.data.get('asset')
        amount_val = request.data.get('amount')
        address = request.data.get('address')
        network = request.data.get('network')
        idempotency_key = request.data.get('idempotencyKey') or str(uuid.uuid4())

        if not user_id or not asset or not amount_val or not address or not network:
            return Response({'error': 'Missing required withdrawal parameters'}, status=status.HTTP_400_BAD_REQUEST)

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = Decimal(str(amount_val))
            if amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'Withdrawal amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing withdrawal with this idempotency key
        existing = WithdrawalRequest.objects.filter(user_id=account.id, idempotency_key=idempotency_key).first()
        if existing:
            return Response({
                'message': 'Withdrawal request already submitted (idempotent).',
                'withdrawalId': str(existing.withdrawal_uuid),
                'status': existing.status,
                'alreadyProcessed': True
            }, status=status.HTTP_200_OK)

        withdrawal_uuid = uuid.uuid4()
        ledger_ref = f"WD_{withdrawal_uuid}"

        try:
            with transaction.atomic():
                # 1. Create persistent WithdrawalRequest record
                req_obj = WithdrawalRequest.objects.create(
                    withdrawal_uuid=withdrawal_uuid,
                    user_id=account.id,
                    asset=asset.upper(),
                    amount=amount,
                    address=address,
                    network=network,
                    status='pending',
                    idempotency_key=idempotency_key
                )

                # 2. Deduct available balance and record in double-entry ledger
                post_ledger_transaction(
                    reference_id=ledger_ref,
                    transaction_type='WITHDRAWAL_REQUEST',
                    description=f'Withdrawal request to {address} on {network}',
                    entries=[
                        {'user': account, 'account_type': 'spot', 'asset': asset, 'direction': 'debit', 'amount': amount},
                        {'user': None, 'account_type': 'system_withdrawals', 'asset': asset, 'direction': 'credit', 'amount': amount}
                    ]
                )

            return Response({
                'message': 'Withdrawal request submitted and is pending approval.',
                'withdrawalId': str(withdrawal_uuid),
                'status': 'pending',
                'deducted': str(amount)
            }, status=status.HTTP_200_OK)

        except InsufficientFunds:
            return Response({'error': f'Insufficient {asset.upper()} balance.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Withdrawal error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WithdrawalsHistoryView(APIView):
    """
    GET /api/wallet/withdrawals
    Fetch withdrawal requests for the user.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = request.query_params.get('userId') or request.META.get('HTTP_X_USER_ID')
        account = resolve_goalign_account(user_id)
        if not account:
            # If no user query param, return recent if admin or empty
            return Response({'withdrawals': []}, status=status.HTTP_200_OK)

        withdrawals = WithdrawalRequest.objects.filter(user_id=account.id).order_by('-created_at')
        data = [
            {
                'withdrawal_uuid': str(w.withdrawal_uuid),
                'asset': w.asset,
                'amount': str(w.amount),
                'address': w.address,
                'network': w.network,
                'status': w.status,
                'provider_txid': w.provider_txid,
                'created_at': w.created_at.isoformat() if w.created_at else None,
                'updated_at': w.updated_at.isoformat() if w.updated_at else None
            }
            for w in withdrawals
        ]
        return Response({'withdrawals': data}, status=status.HTTP_200_OK)


class LinkWeb3View(APIView):
    """
    POST /api/wallet/link-web3
    Links web3 eth and sol addresses.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('userId') or request.data.get('user_id')
        eth_address = request.data.get('ethAddress')
        sol_address = request.data.get('solAddress')

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if eth_address:
            account.web3_eth_address = eth_address
        if sol_address:
            account.web3_sol_address = sol_address
        account.save()

        return Response({
            'message': 'Web3 wallets linked successfully',
            'user': {
                'id': account.id,
                'web3_eth_address': account.web3_eth_address,
                'web3_sol_address': account.web3_sol_address
            }
        }, status=status.HTTP_200_OK)


class WalletTransferView(APIView):
    """
    POST /api/wallet/transfer
    Transfers funds internally between spot, futures, and earn wallets.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = (
            request.data.get('user_id') or 
            request.data.get('userId') or 
            request.data.get('firebase_uid') or
            getattr(request.user, 'firebase_uid', None) or
            getattr(request.user, 'id', None)
        )
        asset = (request.data.get('asset') or request.data.get('asset_symbol') or 'USDT').upper()
        amount_val = request.data.get('amount')
        from_acc = request.data.get('from_account') or request.data.get('source_account') or 'spot'
        to_acc = request.data.get('to_account') or request.data.get('target_account') or 'futures'

        account = resolve_goalign_account(user_id)
        if not account:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = Decimal(str(amount_val))
            if amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'Invalid transfer amount'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                post_ledger_transaction(
                    reference_id=f"XFER_{uuid.uuid4().hex[:12]}",
                    transaction_type='INTERNAL_ACCOUNT_TRANSFER',
                    description=f'Transfer {amount} {asset} from {from_acc} to {to_acc}',
                    entries=[
                        {'user': account, 'account_type': from_acc, 'asset': asset, 'direction': 'debit', 'amount': amount},
                        {'user': account, 'account_type': to_acc, 'asset': asset, 'direction': 'credit', 'amount': amount}
                    ]
                )
            return Response({'message': f'Successfully transferred {amount} {asset} from {from_acc} to {to_acc}'}, status=status.HTTP_200_OK)
        except InsufficientFunds:
            return Response({'error': f'Insufficient {asset} available in {from_acc} wallet'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

