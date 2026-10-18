from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Balance, WithdrawalRequest

@admin.register(Balance)
class BalanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'asset', 'account_type', 'total', 'available', 'locked', 'updated_at')
    list_filter = ('asset', 'account_type')
    search_fields = ('user__username', 'user__email', 'asset')
    readonly_fields = ('user', 'asset', 'account_type', 'total', 'available', 'locked', 'updated_at')

    def has_add_permission(self, request):
        # Prevent ghost balances; all balances must be initialized via authenticated onboarding or double-entry deposit
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('withdrawal_uuid', 'user', 'asset', 'amount', 'network', 'status', 'review_action', 'created_at')
    list_filter = ('status', 'asset', 'network', 'created_at')
    search_fields = ('withdrawal_uuid', 'user__username', 'user__email', 'address', 'provider_txid')
    readonly_fields = ('withdrawal_uuid', 'user', 'asset', 'amount', 'network', 'address', 'provider_txid', 'created_at', 'updated_at')

    def review_action(self, obj):
        if obj.status == 'pending':
            url = reverse('admin:withdrawals_queue')
            return format_html('<a href="{}" style="background: #EAB308; color: #1E293B; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">Review in Queue</a>', url)
        return obj.status
    review_action.short_description = "Queue Status"

    def has_add_permission(self, request):
        return False

