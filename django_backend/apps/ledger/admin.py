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
    list_display = ('id', 'transaction_type', 'status', 'reference_id', 'investigate_link', 'created_at')
    list_filter = ('status', 'transaction_type', 'created_at')
    search_fields = ('id', 'reference_id', 'description')
    readonly_fields = ('id', 'created_at', 'reference_id', 'transaction_type', 'status', 'description')
    inlines = [LedgerEntryInline]
    actions = [export_as_csv_action("Export Selected Ledger Transactions to CSV", filename_prefix="goalign_ledger_txs")]

    def investigate_link(self, obj):
        ref = obj.reference_id or obj.id
        url = reverse('admin:audit_investigate', args=[ref])
        return format_html('<a href="{}" class="button" style="padding: 2px 8px; font-size: 11px; background: #0077B6; color: white; border-radius: 4px; text-decoration: none;">Investigate</a>', url)
    investigate_link.short_description = "Investigation"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'ledger_transaction', 'user', 'asset', 'direction', 'amount', 'account_type', 'created_at')
    list_filter = ('direction', 'asset', 'account_type', 'created_at')
    search_fields = ('user__username', 'asset', 'ledger_transaction__id')
    readonly_fields = ('id', 'ledger_transaction', 'user', 'asset', 'direction', 'amount', 'account_type', 'created_at')
    actions = [export_as_csv_action("Export Selected Journal Entries to CSV", filename_prefix="goalign_journal_entries")]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(IdempotencyKey)
class IdempotencyKeyAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'operation', 'idempotency_key', 'created_at')
    list_filter = ('operation', 'created_at')
    search_fields = ('user__username', 'idempotency_key', 'reference')
    readonly_fields = ('id', 'user', 'operation', 'idempotency_key', 'payload_fingerprint', 'response_data', 'reference', 'created_at')


    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

