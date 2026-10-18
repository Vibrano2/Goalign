import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from decimal import Decimal

from apps.authentication.models import GoalignProfile, GoalignAccount
from apps.wallets.models import Balance

logger = logging.getLogger(__name__)

# Try importing firebase_admin for production token verification
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


from apps.authentication.services import ensure_starter_balances


class SyncUserView(APIView):
    """
    POST /api/auth/sync
    Synchronizes Firebase user with PostgreSQL database.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        uid = None
        email = None
        display_name = None

        if auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[1].strip()
            if FIREBASE_AVAILABLE and token:
                try:
                    decoded = firebase_auth.verify_id_token(token)
                    uid = decoded.get('uid')
                    email = decoded.get('email')
                    display_name = decoded.get('name')
                except Exception as e:
                    logger.warning(f"Firebase token verify failed or skipped: {e}")

        # Fallback to request body if token decode was skipped (e.g., local dev)
        if not uid:
            uid = request.data.get('uid') or request.data.get('firebase_uid') or request.data.get('firebaseUid') or request.data.get('userId')
        if not email:
            email = request.data.get('email')
        if not display_name:
            display_name = request.data.get('displayName') or request.data.get('display_name')

        if not uid or not email:
            return Response(
                {'error': 'Missing required user parameters (uid, email)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not display_name:
            display_name = email.split('@')[0]

        with transaction.atomic():
            # 1. Update or create GoalignAccount (PostgreSQL `users` table)
            account, created = GoalignAccount.objects.get_or_create(
                email=email,
                defaults={
                    'firebase_uid': uid,
                    'display_name': display_name,
                    'vip_level': 0,
                    'is_admin': False,
                    'kyc_status': 'unverified'
                }
            )
            if not created:
                updated = False
                if account.firebase_uid != uid:
                    account.firebase_uid = uid
                    updated = True
                if not account.display_name and display_name:
                    account.display_name = display_name
                    updated = True
                if updated:
                    account.save()

            # 2. Update or create Django User & GoalignProfile
            django_user, _ = User.objects.get_or_create(
                username=email,
                defaults={'email': email, 'first_name': display_name[:30]}
            )
            GoalignProfile.objects.get_or_create(
                user=django_user,
                defaults={'firebase_uid': uid}
            )

            # 3. Ensure starter balances for trading
            if created:
                ensure_starter_balances(account.id)

        return Response({
            'success': True,
            'user': {
                'id': account.id,
                'firebase_uid': account.firebase_uid,
                'email': account.email,
                'display_name': account.display_name,
                'vip_level': account.vip_level,
                'is_admin': account.is_admin,
                'kyc_status': account.kyc_status,
                'web3_eth_address': account.web3_eth_address,
                'web3_sol_address': account.web3_sol_address
            }
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    GET /api/auth/me
    Returns current authenticated user details.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = (
            request.query_params.get('userId') or
            request.query_params.get('user_id') or
            request.query_params.get('firebase_uid') or
            request.query_params.get('firebaseUid') or
            request.META.get('HTTP_X_USER_ID')
        )
        if not user_id and request.user.is_authenticated:
            try:
                profile = request.user.goalign_profile
                user_id = profile.firebase_uid
            except Exception:
                user_id = request.user.username

        if not user_id:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            if str(user_id).isdigit():
                account = GoalignAccount.objects.get(id=int(user_id))
            else:
                account = GoalignAccount.objects.get(firebase_uid=str(user_id))

            return Response({
                'id': account.id,
                'firebase_uid': account.firebase_uid,
                'email': account.email,
                'display_name': account.display_name,
                'vip_level': account.vip_level,
                'is_admin': account.is_admin,
                'kyc_status': account.kyc_status,
                'web3_eth_address': account.web3_eth_address,
                'web3_sol_address': account.web3_sol_address
            })
        except GoalignAccount.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
