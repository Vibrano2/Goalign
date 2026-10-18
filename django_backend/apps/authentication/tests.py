from django.test import TestCase
from unittest.mock import patch
from rest_framework.test import APIRequestFactory
from apps.authentication.authentication import FirebaseTokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User, Group
from apps.authentication.models import GoalignProfile
from apps.authentication.permissions import IsFinanceOperator, IsSuperAdmin

class AuthenticationTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.auth = FirebaseTokenAuthentication()
        self.finance_group = Group.objects.create(name='FINANCE_OPERATOR')
        self.superadmin_group = Group.objects.create(name='SUPERADMIN')

    def test_missing_auth_header(self):
        request = self.factory.get('/api/test/')
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    def test_malformed_auth_header(self):
        request = self.factory.get('/api/test/', HTTP_AUTHORIZATION='Token xyz')
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    @patch('apps.authentication.authentication.firebase_auth.verify_id_token')
    def test_invalid_firebase_token(self, mock_verify):
        mock_verify.side_effect = Exception("Expired")
        request = self.factory.get('/api/test/', HTTP_AUTHORIZATION='Bearer expired_token')
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    @patch('apps.authentication.authentication.firebase_auth.verify_id_token')
    def test_valid_firebase_token_identity_mapping(self, mock_verify):
        mock_verify.return_value = {'uid': 'test_firebase_uid_123', 'email': 'test@example.com', 'admin': True}
        request = self.factory.get('/api/test/', HTTP_AUTHORIZATION='Bearer valid_token')
        
        user, token = self.auth.authenticate(request)
        
        # Identity Mapping Verification
        self.assertEqual(token['uid'], 'test_firebase_uid_123')
        self.assertTrue(user.username.startswith('firebase_'))
        
        # Verify Firebase UID is unique and mapped correctly
        profile = GoalignProfile.objects.get(firebase_uid='test_firebase_uid_123')
        self.assertEqual(profile.user, user)
        
        # Verify frontend roles are ignored
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)

        # Same UID logs in again
        user2, token2 = self.auth.authenticate(request)
        self.assertEqual(user, user2)

    @patch('apps.authentication.authentication.firebase_auth.verify_id_token')
    def test_disabled_account_rejected(self, mock_verify):
        mock_verify.return_value = {'uid': 'test_firebase_uid_disabled'}
        user = User.objects.create(username='firebase_temp', is_active=False)
        profile = GoalignProfile.objects.create(firebase_uid='test_firebase_uid_disabled', user=user)
        
        request = self.factory.get('/api/test/', HTTP_AUTHORIZATION='Bearer valid_token')
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_rbac_finance_operator(self):
        user = User.objects.create(username='testuser')
        request = self.factory.get('/api/test/')
        request.user = user
        
        perm = IsFinanceOperator()
        self.assertFalse(perm.has_permission(request, None))
        
        user.groups.add(self.finance_group)
        self.assertTrue(perm.has_permission(request, None))

    def test_superadmin_policy(self):
        # Native Django superuser without the Goalign SUPERADMIN group MUST NOT be a Goalign SuperAdmin
        # unless explicitly designed. The prompt asks to NOT automatically grant it merely because they are superusers.
        # So we should modify our permission class so `is_superuser` is NOT enough by itself, 
        # or `SUPERADMIN` group is required. We'll enforce `SUPERADMIN` group explicitly.
        
        user = User.objects.create(username='superuser_django', is_superuser=True, is_staff=True)
        request = self.factory.get('/api/test/')
        request.user = user
        
        perm = IsSuperAdmin()
        # Should be FALSE because they don't have the Goalign SUPERADMIN group
        self.assertFalse(perm.has_permission(request, None))
        
        # Now add the group
        user.groups.add(self.superadmin_group)
        self.assertTrue(perm.has_permission(request, None))

    @patch('apps.authentication.authentication.firebase_auth.verify_id_token')
    def test_different_uid_cannot_takeover(self, mock_verify):
        # User A
        mock_verify.return_value = {'uid': 'uid_A'}
        request_a = self.factory.get('/api/test/', HTTP_AUTHORIZATION='Bearer token_a')
        user_a, _ = self.auth.authenticate(request_a)
        
        # User B
        mock_verify.return_value = {'uid': 'uid_B'}
        request_b = self.factory.get('/api/test/', HTTP_AUTHORIZATION='Bearer token_b')
        user_b, _ = self.auth.authenticate(request_b)
        
        self.assertNotEqual(user_a.pk, user_b.pk)
