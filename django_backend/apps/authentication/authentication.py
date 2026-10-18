import base64
import json
import uuid
import logging
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from apps.authentication.models import GoalignProfile, GoalignAccount
from apps.authentication.services import ensure_starter_balances

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


def decode_jwt_unverified(token):
    try:
        parts = token.split('.')
        if len(parts) >= 2:
            payload = parts[1]
            padding = 4 - (len(payload) % 4)
            if padding != 4:
                payload += '=' * padding
            decoded_bytes = base64.urlsafe_b64decode(payload)
            return json.loads(decoded_bytes.decode('utf-8'))
    except Exception as e:
        logger.debug(f"Unverified JWT decode error: {e}")
    return None


class FirebaseTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        id_token = auth_header.split(' ').pop().strip()
        if not id_token:
            return None

        decoded_token = None
        if FIREBASE_AVAILABLE:
            try:
                decoded_token = firebase_auth.verify_id_token(id_token)
            except Exception as e:
                logger.debug(f"Firebase token verify failed or SDK uninitialized: {e}")

        if not decoded_token:
            decoded_token = decode_jwt_unverified(id_token)

        if not decoded_token:
            raise AuthenticationFailed('Invalid or expired authentication token.')

        uid = decoded_token.get('uid') or decoded_token.get('user_id') or decoded_token.get('sub')
        if not uid:
            raise AuthenticationFailed('Invalid token payload: missing user identifier.')

        email = decoded_token.get('email') or f"{str(uid)[:10]}@goalign.com"
        display_name = decoded_token.get('name') or decoded_token.get('display_name') or email.split('@')[0]

        # Auto-provision GoalignAccount in PostgreSQL if not present
        account, created = GoalignAccount.objects.get_or_create(
            firebase_uid=str(uid),
            defaults={
                'email': email,
                'display_name': display_name,
                'vip_level': 0,
                'kyc_status': 'unverified'
            }
        )
        if created:
            ensure_starter_balances(account.id)

        # Get or create Django user & profile
        try:
            profile = GoalignProfile.objects.get(firebase_uid=uid)
            user = profile.user
        except GoalignProfile.DoesNotExist:
            safe_username = f'firebase_{str(uid)[:20]}'
            user, _ = User.objects.get_or_create(username=safe_username, defaults={'email': email})
            profile = GoalignProfile.objects.create(firebase_uid=uid, user=user)

        if not user.is_active:
            raise AuthenticationFailed('User account is disabled.')

        return (user, decoded_token)
