from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import LedgerTransaction, LedgerEntry, IdempotencyKey
from apps.audit.export import export_as_csv_action

class LedgerEntryInline(admin.TabularInline):
    model = LedgerEntry
    extra = 0
    readonly_fields = ('id', 'user', 'account_type', 'asset', 'direction', 'amount', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(LedgerTransaction)
class LedgerTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction_type_badge', 'status_badge', 'ref_formatted', 'investigate_link', 'created_at')
    list_filter = ('status', 'transaction_type', 'created_at')
    search_fields = ('id', 'reference_id', 'description')
    readonly_fields = ('id', 'created_at', 'reference_id', 'transaction_type', 'status', 'description')
    inlines = [LedgerEntryInline]
    actions = [export_as_csv_action("Export Selected Ledger Transactions to CSV", filename_prefix="goalign_ledger_txs")]

    def transaction_type_badge(self, obj):
        return format_html('<span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;">{}</span>', obj.transaction_type)
    transaction_type_badge.short_description = "Transaction Type"

    def status_badge(self, obj):
        color = "#10B981" if obj.status.lower() == 'posted' else "#EF4444"
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', color, obj.status.upper())
    status_badge.short_description = "Status"

    def ref_formatted(self, obj):
        val = obj.reference_id or '-'
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 11px; color: #475569;" title="{}">{}</span>', val, (val[:20] + '...') if len(val) > 20 else val)
    ref_formatted.short_description = "Reference ID"

    def investigate_link(self, obj):
        ref = obj.reference_id or obj.id
        url = reverse('admin:audit_investigate', args=[ref])
        return format_html('<a href="{}" style="padding: 3px 10px; font-size: 11px; background: #0077B6; color: white; border-radius: 4px; text-decoration: none; font-weight: 600;">Investigate</a>', url)
    investigate_link.short_description = "Investigation"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'ledger_transaction', 'user', 'asset_badge', 'direction_badge', 'amount_formatted', 'account_badge', 'created_at')
    list_filter = ('direction', 'asset', 'account_type', 'created_at')
    search_fields = ('user__username', 'asset', 'ledger_transaction__id')
    readonly_fields = ('id', 'ledger_transaction', 'user', 'asset', 'direction', 'amount', 'account_type', 'created_at')
    actions = [export_as_csv_action("Export Selected Journal Entries to CSV", filename_prefix="goalign_journal_entries")]

    def asset_badge(self, obj):
        return format_html('<span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span>', obj.asset)
    asset_badge.short_description = "Asset"

    def direction_badge(self, obj):
        if obj.direction.lower() == 'credit':
            return format_html('<span style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">CREDIT</span>')
        return format_html('<span style="background: rgba(0, 180, 216, 0.15); color: #00B4D8; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">DEBIT</span>')
    direction_badge.short_description = "Direction"

    def amount_formatted(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; font-weight: 700;">{:.8f}</span>', obj.amount)
    amount_formatted.short_description = "Amount"

    def account_badge(self, obj):
        return format_html('<span style="background: rgba(100, 116, 139, 0.1); color: #475569; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span>', obj.account_type)
    account_badge.short_description = "Account"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(IdempotencyKey)
class IdempotencyKeyAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'operation', 'key_formatted', 'created_at')
    list_filter = ('operation', 'created_at')
    search_fields = ('idempotency_key', 'user__username')
    readonly_fields = ('user', 'operation', 'idempotency_key', 'payload_fingerprint', 'response_data', 'reference', 'created_at')

    def key_formatted(self, obj):
        val = obj.idempotency_key
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 11px; color: #475569;" title="{}">{}...</span>', val, val[:24])
    key_formatted.short_description = "Idempotency Key"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
