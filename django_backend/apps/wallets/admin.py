from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Balance, WithdrawalRequest
from apps.audit.export import export_as_csv_action

@admin.register(Balance)
class BalanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_cell', 'asset_badge', 'account_type_badge', 'formatted_total', 'formatted_available', 'formatted_locked', 'updated_at')
    list_filter = ('asset', 'account_type')
    search_fields = ('user__username', 'user__email', 'asset')
    readonly_fields = ('user', 'asset', 'account_type', 'total', 'available', 'locked', 'updated_at')
    actions = [export_as_csv_action("Export Selected Balances to CSV", filename_prefix="goalign_balances")]

    def user_cell(self, obj):
        email = obj.user.email if hasattr(obj.user, 'email') and obj.user.email else (obj.user.username if obj.user else '-')
        return format_html('<span style="font-weight: 600; color: #03045E;">{}</span>', email)
    user_cell.short_description = "Account Holder"

    def asset_badge(self, obj):
        return format_html('<span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 800; padding: 2px 7px; border-radius: 4px; font-size: 11px;">{}</span>', obj.asset)
    asset_badge.short_description = "Asset"

    def account_type_badge(self, obj):
        at = obj.account_type.lower()
        colors = {
            'spot': ('rgba(0, 119, 182, 0.1)', '#0077B6'),
            'futures': ('rgba(139, 92, 246, 0.1)', '#8B5CF6'),
            'escrow': ('rgba(245, 158, 11, 0.1)', '#D97706'),
        }
        bg, fg = colors.get(at, ('rgba(100, 116, 139, 0.1)', '#475569'))
        return format_html('<span style="background: {}; color: {}; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">{}</span>', bg, fg, obj.account_type)
    account_type_badge.short_description = "Vault Type"

    def formatted_total(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; font-weight: 700;">{:.8f}</span>', obj.total)
    formatted_total.short_description = "Total Balance"

    def formatted_available(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; color: #10B981; font-weight: 600;">{:.8f}</span>', obj.available)
    formatted_available.short_description = "Available"

    def formatted_locked(self, obj):
        color = "#F59E0B" if obj.locked > 0 else "#94A3B8"
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; color: {};">{:.8f}</span>', color, obj.locked)
    formatted_locked.short_description = "Locked"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('uuid_short', 'user_cell', 'asset_badge', 'amount_formatted', 'status_badge', 'review_action', 'created_at')
    list_filter = ('status', 'asset', 'network', 'created_at')
    search_fields = ('withdrawal_uuid', 'user__username', 'user__email', 'address', 'provider_txid')
    readonly_fields = ('withdrawal_uuid', 'user', 'asset', 'amount', 'network', 'address', 'provider_txid', 'created_at', 'updated_at')
    actions = [export_as_csv_action("Export Selected Withdrawals to CSV", filename_prefix="goalign_withdrawals")]

    def uuid_short(self, obj):
        return format_html('<span style="font-family: monospace; font-size: 11px; color: #0077B6; font-weight: 700;" title="{}">{}...</span>', str(obj.withdrawal_uuid), str(obj.withdrawal_uuid)[:10])
    uuid_short.short_description = "UUID"

    def user_cell(self, obj):
        email = obj.user.email if hasattr(obj.user, 'email') and obj.user.email else (obj.user.username if obj.user else '-')
        return format_html('<span style="font-weight: 600;">{}</span>', email)
    user_cell.short_description = "Beneficiary"

    def asset_badge(self, obj):
        return format_html('<span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span> <span style="font-size: 10px; color: #64748B;">{}</span>', obj.asset, obj.network)
    asset_badge.short_description = "Asset / Network"

    def amount_formatted(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; font-weight: 700;">{:.8f}</span>', obj.amount)
    amount_formatted.short_description = "Amount"

    def status_badge(self, obj):
        st = obj.status.lower()
        if st == 'completed':
            return format_html('<span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">COMPLETED</span>')
        if st == 'pending':
            return format_html('<span style="background: #F59E0B; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">PENDING</span>')
        if st == 'rejected':
            return format_html('<span style="background: #EF4444; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">REJECTED</span>')
        return format_html('<span style="background: #64748B; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', obj.status.upper())
    status_badge.short_description = "Status"

    def review_action(self, obj):
        if obj.status == 'pending':
            url = reverse('admin:withdrawals_queue')
            return format_html('<a href="{}" style="background: #F59E0B; color: #0F172A; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; text-decoration: none;">Review in Queue</a>', url)
        else:
            url = reverse('admin:audit_investigate', args=[str(obj.withdrawal_uuid)])
            return format_html('<a href="{}" style="background: #0077B6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-decoration: none;">Audit Trail</a>', url)
    review_action.short_description = "Action"

    def has_add_permission(self, request):
        return False
