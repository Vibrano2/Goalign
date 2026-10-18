from django.contrib import admin
from .models import Balance, WithdrawalRequest

@admin.register(Balance)
class BalanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'asset', 'account_type', 'total', 'available', 'locked', 'updated_at')
    list_filter = ('asset', 'account_type')
    search_fields = ('user__username', 'user__email', 'asset')
    readonly_fields = ('updated_at',)

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('withdrawal_uuid', 'user', 'asset', 'amount', 'network', 'status', 'created_at')
    list_filter = ('status', 'asset', 'network', 'created_at')
    search_fields = ('withdrawal_uuid', 'user__username', 'user__email', 'address', 'provider_txid')
    readonly_fields = ('withdrawal_uuid', 'created_at', 'updated_at')
