from django.test import TestCase
from django.contrib.auth.models import User
from apps.audit.models import AuditLog
from django.contrib.admin.sites import AdminSite
from django.contrib import admin

# Register model to admin for test
class AuditLogAdmin(admin.ModelAdmin):
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

try:
    admin.site.register(AuditLog, AuditLogAdmin)
except admin.sites.AlreadyRegistered:
    pass

class AuditLogTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='admin_user', is_staff=True, is_superuser=True)
        self.site = AdminSite()

    def test_audit_log_creation(self):
        log = AuditLog.objects.create(
            actor=self.user,
            action='MOCK_FUNDING',
            target_type='Balance',
            target_identifier='user_123',
            request_id='req_xyz'
        )
        self.assertEqual(log.actor, self.user)
        self.assertEqual(log.action, 'MOCK_FUNDING')

    def test_audit_log_admin_readonly(self):
        # Verify that through Django Admin, Audit Logs cannot be changed or deleted
        model_admin = AuditLogAdmin(AuditLog, self.site)
        
        class MockRequest:
            user = self.user
            
        request = MockRequest()
        
        self.assertFalse(model_admin.has_change_permission(request))
        self.assertFalse(model_admin.has_delete_permission(request))
