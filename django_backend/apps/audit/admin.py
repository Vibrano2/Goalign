from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor', 'action', 'target_type', 'target_identifier', 'request_id')
    list_filter = ('action', 'target_type', 'timestamp')
    search_fields = ('actor__username', 'action', 'target_identifier', 'request_id')
    readonly_fields = ('id', 'timestamp', 'actor', 'action', 'target_type', 'target_identifier', 'metadata', 'request_id')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

