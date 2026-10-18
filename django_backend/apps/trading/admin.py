from django.contrib import admin
from .models import (
    Order, Trade, Position, OptionPosition,
    P2PAd, P2POrder, CopyAllocation, Stake, KYCApplication
)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'symbol', 'side', 'type', 'price', 'amount', 'status', 'created_at')
    list_filter = ('status', 'side', 'type', 'symbol', 'created_at')
    search_fields = ('user__email', 'symbol', 'client_order_id')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'symbol', 'side', 'price', 'amount', 'fee', 'created_at')
    list_filter = ('side', 'symbol', 'created_at')
    search_fields = ('user__email', 'symbol')
    readonly_fields = ('created_at',)

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'symbol', 'side', 'leverage', 'margin', 'entry_price', 'liquidation_price', 'status', 'created_at')
    list_filter = ('status', 'side', 'symbol', 'leverage')
    search_fields = ('user__email', 'symbol')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(OptionPosition)
class OptionPositionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'symbol', 'type', 'side', 'strike_price', 'premium_paid', 'expiry_date', 'status')
    list_filter = ('status', 'type', 'side', 'symbol')
    search_fields = ('user__email', 'symbol')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(P2PAd)
class P2PAdAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'type', 'asset', 'fiat', 'price', 'available_amount', 'status')
    list_filter = ('status', 'type', 'asset', 'fiat')
    search_fields = ('user__email', 'asset', 'fiat')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(P2POrder)
class P2POrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'seller', 'crypto_amount', 'asset', 'fiat_amount', 'fiat', 'status', 'created_at')
    list_filter = ('status', 'asset', 'fiat', 'payment_method')
    search_fields = ('buyer__email', 'seller__email', 'asset')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(CopyAllocation)
class CopyAllocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'master_name', 'allocated_amount', 'current_value', 'status', 'created_at')
    list_filter = ('status', 'master_name')
    search_fields = ('user__email', 'master_name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Stake)
class StakeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'asset', 'amount', 'apy', 'status', 'created_at', 'redeemed_at')
    list_filter = ('status', 'asset')
    search_fields = ('user__email', 'asset')
    readonly_fields = ('created_at',)

@admin.register(KYCApplication)
class KYCApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'full_name', 'id_type', 'date_of_birth', 'review_queue_link', 'created_at')
    list_filter = ('id_type', 'created_at')
    search_fields = ('full_name', 'user__email', 'address')
    readonly_fields = ('created_at',)

    def review_queue_link(self, obj):
        from django.utils.html import format_html
        from django.urls import reverse
        url = reverse('admin:kyc_queue')
        return format_html('<a href="{}" style="background: #087CCF; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Review in Queue</a>', url)
    review_queue_link.short_description = "Review Action"

