from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    Order, Trade, Position, OptionPosition,
    P2PAd, P2POrder, CopyAllocation, Stake, KYCApplication
)
from apps.audit.export import export_as_csv_action


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'symbol', 'side_badge', 'type_badge', 'formatted_price', 'formatted_amount', 'status_badge', 'created_at')
    list_filter = ('status', 'side', 'type', 'symbol', 'created_at')
    search_fields = ('user__email', 'symbol', 'client_order_id')
    readonly_fields = ('created_at', 'updated_at')
    actions = [export_as_csv_action("Export Selected Orders to CSV", filename_prefix="goalign_orders")]

    def side_badge(self, obj):
        if obj.side.lower() == 'buy':
            return format_html('<span style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">BUY</span>')
        return format_html('<span style="background: rgba(239, 68, 68, 0.15); color: #EF4444; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">SELL</span>')
    side_badge.short_description = "Side"

    def type_badge(self, obj):
        return format_html('<span style="background: rgba(100, 116, 139, 0.12); color: #475569; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">{}</span>', obj.type)
    type_badge.short_description = "Type"

    def status_badge(self, obj):
        st = obj.status.lower()
        if st == 'filled':
            return format_html('<span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">FILLED</span>')
        if st == 'open':
            return format_html('<span style="background: #F59E0B; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">OPEN</span>')
        if st == 'canceled':
            return format_html('<span style="background: #64748B; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">CANCELED</span>')
        return format_html('<span style="background: #00B4D8; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', obj.status.upper())
    status_badge.short_description = "Status"

    def formatted_price(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px;">{:.8f}</span>', obj.price)
    formatted_price.short_description = "Price"

    def formatted_amount(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; font-weight: 600;">{:.8f}</span>', obj.amount)
    formatted_amount.short_description = "Amount"


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_link', 'user', 'symbol', 'side_badge', 'formatted_price', 'formatted_amount', 'formatted_fee', 'created_at')
    list_filter = ('side', 'symbol', 'created_at')
    search_fields = ('user__email', 'symbol')
    readonly_fields = ('created_at',)
    actions = [export_as_csv_action("Export Selected Trades to CSV", filename_prefix="goalign_trades")]

    def side_badge(self, obj):
        if obj.side.lower() == 'buy':
            return format_html('<span style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">BUY</span>')
        return format_html('<span style="background: rgba(239, 68, 68, 0.15); color: #EF4444; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">SELL</span>')
    side_badge.short_description = "Side"

    def order_link(self, obj):
        if obj.order_id:
            url = reverse('admin:trading_order_change', args=[obj.order_id])
            return format_html('<a href="{}" style="color: #0077B6; font-weight: 700; font-family: monospace;">#{}</a>', url, obj.order_id)
        return "-"
    order_link.short_description = "Order"

    def formatted_price(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px;">{:.8f}</span>', obj.price)
    formatted_price.short_description = "Price"

    def formatted_amount(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; font-weight: 600;">{:.8f}</span>', obj.amount)
    formatted_amount.short_description = "Amount"

    def formatted_fee(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; color: #64748B;">{:.8f}</span>', obj.fee)
    formatted_fee.short_description = "Fee"


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'symbol', 'side_badge', 'leverage_badge', 'formatted_margin', 'formatted_entry_price', 'formatted_liquidation_price', 'status_badge', 'created_at')
    list_filter = ('status', 'side', 'symbol', 'leverage')
    search_fields = ('user__email', 'symbol')
    readonly_fields = ('created_at', 'updated_at')
    actions = [export_as_csv_action("Export Selected Positions to CSV", filename_prefix="goalign_positions")]

    def side_badge(self, obj):
        if obj.side.lower() == 'long':
            return format_html('<span style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">LONG</span>')
        return format_html('<span style="background: rgba(239, 68, 68, 0.15); color: #EF4444; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">SHORT</span>')
    side_badge.short_description = "Side"

    def leverage_badge(self, obj):
        return format_html('<span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace;">{}x</span>', obj.leverage)
    leverage_badge.short_description = "Leverage"

    def status_badge(self, obj):
        st = obj.status.lower()
        if st == 'open':
            return format_html('<span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">OPEN</span>')
        if st == 'liquidated':
            return format_html('<span style="background: #EF4444; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">LIQUIDATED</span>')
        return format_html('<span style="background: #64748B; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', obj.status.upper())
    status_badge.short_description = "Status"

    def formatted_margin(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; font-weight: 600;">{:.4f}</span>', obj.margin)
    formatted_margin.short_description = "Margin"

    def formatted_entry_price(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px;">{:.4f}</span>', obj.entry_price)
    formatted_entry_price.short_description = "Entry Price"

    def formatted_liquidation_price(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; color: #EF4444; font-weight: 600;">{:.4f}</span>', obj.liquidation_price)
    formatted_liquidation_price.short_description = "Liq. Price"


@admin.register(OptionPosition)
class OptionPositionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'symbol', 'type_badge', 'side_badge', 'strike_price', 'premium_paid', 'expiry_date', 'status_badge')
    list_filter = ('status', 'type', 'side', 'symbol')
    search_fields = ('user__email', 'symbol')
    readonly_fields = ('created_at', 'updated_at')

    def type_badge(self, obj):
        color = "#10B981" if obj.type.lower() == 'call' else "#EF4444"
        return format_html('<span style="background: rgba(0,0,0,0.06); color: {}; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span>', color, obj.type.upper())
    type_badge.short_description = "Option Type"

    def side_badge(self, obj):
        return format_html('<span style="font-weight: 600; font-size: 11px; text-transform: uppercase;">{}</span>', obj.side)
    side_badge.short_description = "Side"

    def status_badge(self, obj):
        st = obj.status.lower()
        color = "#10B981" if st == 'active' else "#64748B"
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', color, obj.status.upper())
    status_badge.short_description = "Status"


@admin.register(P2PAd)
class P2PAdAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'type_badge', 'asset_badge', 'fiat', 'price', 'available_amount', 'status_badge')
    list_filter = ('status', 'type', 'asset', 'fiat')
    search_fields = ('user__email', 'asset', 'fiat')
    readonly_fields = ('created_at', 'updated_at')

    def type_badge(self, obj):
        color = "#10B981" if obj.type.lower() == 'buy' else "#EF4444"
        return format_html('<span style="background: rgba(0,0,0,0.06); color: {}; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span>', color, obj.type.upper())
    type_badge.short_description = "Type"

    def asset_badge(self, obj):
        return format_html('<span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span>', obj.asset)
    asset_badge.short_description = "Asset"

    def status_badge(self, obj):
        color = "#10B981" if obj.status.lower() == 'active' else "#64748B"
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', color, obj.status.upper())
    status_badge.short_description = "Status"


@admin.register(P2POrder)
class P2POrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'seller', 'crypto_formatted', 'fiat_formatted', 'price', 'payment_method', 'status_badge', 'dispute_action', 'created_at')
    list_filter = ('status', 'asset', 'fiat', 'payment_method')
    search_fields = ('buyer__email', 'seller__email', 'asset')
    readonly_fields = ('created_at', 'updated_at')
    actions = [export_as_csv_action("Export Selected P2P Orders to CSV", filename_prefix="goalign_p2p_orders")]

    def crypto_formatted(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-weight: 700; font-size: 12px;">{:.4f}</span> <span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 700; padding: 1px 5px; border-radius: 4px; font-size: 10px;">{}</span>', obj.crypto_amount, obj.asset)
    crypto_formatted.short_description = "Escrow Crypto"

    def fiat_formatted(self, obj):
        return format_html('<span style="font-weight: 700; font-size: 12px;">{:.2f}</span> <span style="color: #64748B; font-size: 10px;">{}</span>', obj.fiat_amount, obj.fiat)
    fiat_formatted.short_description = "Fiat Value"

    def status_badge(self, obj):
        st = obj.status.lower()
        if st == 'disputed':
            return format_html('<span style="background: #EF4444; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">DISPUTED</span>')
        if st == 'completed':
            return format_html('<span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">COMPLETED</span>')
        if st == 'paid':
            return format_html('<span style="background: #0077B6; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">BUYER PAID</span>')
        if st == 'pending':
            return format_html('<span style="background: #F59E0B; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">PENDING</span>')
        return format_html('<span style="background: #64748B; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', obj.status.upper())
    status_badge.short_description = "Status"

    def dispute_action(self, obj):
        if obj.status.lower() in ['disputed', 'paid', 'pending']:
            url = reverse('admin:p2p_disputes')
            return format_html('<a href="{}" style="background: #0077B6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-decoration: none; font-weight: 600;">Arbitrate</a>', url)
        return "-"
    dispute_action.short_description = "Arbitration"


@admin.register(CopyAllocation)
class CopyAllocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'master_name', 'allocated_amount', 'current_value', 'status_badge', 'created_at')
    list_filter = ('status', 'master_name')
    search_fields = ('user__email', 'master_name')
    readonly_fields = ('created_at', 'updated_at')

    def status_badge(self, obj):
        color = "#10B981" if obj.status.lower() == 'active' else "#64748B"
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', color, obj.status.upper())
    status_badge.short_description = "Status"


@admin.register(Stake)
class StakeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'asset_badge', 'amount_formatted', 'apy_badge', 'status_badge', 'created_at', 'redeemed_at')
    list_filter = ('status', 'asset')
    search_fields = ('user__email', 'asset')
    readonly_fields = ('created_at',)

    def asset_badge(self, obj):
        return format_html('<span style="background: rgba(0, 119, 182, 0.12); color: #0077B6; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span>', obj.asset)
    asset_badge.short_description = "Asset"

    def amount_formatted(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; font-weight: 600;">{:.4f}</span>', obj.amount)
    amount_formatted.short_description = "Staked Amount"

    def apy_badge(self, obj):
        return format_html('<span style="color: #10B981; font-weight: 800; font-size: 12px;">{:.2f}% APY</span>', obj.apy)
    apy_badge.short_description = "APY"

    def status_badge(self, obj):
        color = "#10B981" if obj.status.lower() == 'active' else "#64748B"
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>', color, obj.status.upper())
    status_badge.short_description = "Status"


@admin.register(KYCApplication)
class KYCApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'full_name', 'id_type', 'date_of_birth', 'review_queue_link', 'created_at')
    list_filter = ('id_type', 'created_at')
    search_fields = ('full_name', 'user__email', 'address')
    readonly_fields = ('created_at',)

    def review_queue_link(self, obj):
        url = reverse('admin:kyc_queue')
        return format_html('<a href="{}" style="background: #0077B6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-decoration: none; font-weight: 600;">Review in Queue</a>', url)
    review_queue_link.short_description = "Review Action"
