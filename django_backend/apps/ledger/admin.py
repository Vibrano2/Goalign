from django.contrib import admin
from .models import LedgerTransaction, LedgerEntry, IdempotencyKey

class LedgerEntryInline(admin.TabularInline):
    model = LedgerEntry
    extra = 0
    readonly_fields = ('id', 'user', 'account_type', 'asset', 'direction', 'amount', 'created_at')
    can_delete = False

@admin.register(LedgerTransaction)
class LedgerTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction_type', 'status', 'reference_id', 'created_at')
    list_filter = ('status', 'transaction_type', 'created_at')
    search_fields = ('id', 'reference_id', 'description')
    readonly_fields = ('id', 'created_at')
    inlines = [LedgerEntryInline]

@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'ledger_transaction', 'user', 'asset', 'direction', 'amount', 'account_type', 'created_at')
    list_filter = ('direction', 'asset', 'account_type', 'created_at')
    search_fields = ('user__username', 'asset', 'ledger_transaction__id')
    readonly_fields = ('id', 'created_at')

@admin.register(IdempotencyKey)
class IdempotencyKeyAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'operation', 'idempotency_key', 'created_at')
    list_filter = ('operation', 'created_at')
    search_fields = ('user__username', 'idempotency_key', 'reference')
    readonly_fields = ('created_at',)
