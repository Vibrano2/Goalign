from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.urls import reverse
from .models import GoalignProfile, GoalignAccount
from apps.audit.export import export_as_csv_action

class GoalignProfileInline(admin.StackedInline):
    model = GoalignProfile
    can_delete = False
    verbose_name_plural = 'Goalign Profile'

class CustomUserAdmin(BaseUserAdmin):
    inlines = [GoalignProfileInline]

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(GoalignProfile)
class GoalignProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'firebase_uid_short')
    search_fields = ('user__username', 'user__email', 'firebase_uid')
    readonly_fields = ('firebase_uid',)

    def firebase_uid_short(self, obj):
        val = obj.firebase_uid or '-'
        return format_html('<span style="font-family: monospace; font-size: 11px; color: #475569;" title="{}">{}...</span>', val, val[:20])
    firebase_uid_short.short_description = "Firebase UID"

@admin.register(GoalignAccount)
class GoalignAccountAdmin(admin.ModelAdmin):
    list_display = ('id_formatted', 'email_cell', 'display_name', 'vip_badge', 'role_badge', 'kyc_status_badge', 'quick_actions', 'created_at')
    list_filter = ('vip_level', 'is_admin', 'kyc_status', 'created_at')
    search_fields = ('email', 'display_name', 'firebase_uid', 'web3_eth_address')
    readonly_fields = ('firebase_uid', 'web3_eth_address', 'created_at', 'updated_at')
    actions = [export_as_csv_action("Export Selected Accounts to CSV", filename_prefix="goalign_accounts")]

    def id_formatted(self, obj):
        return format_html('<span style="font-family: \'JetBrains Mono\', monospace; font-weight: 700; color: #0077B6;">#{}</span>', obj.id)
    id_formatted.short_description = "ID"

    def email_cell(self, obj):
        return format_html('<span style="font-weight: 600; color: #03045E;">{}</span>', obj.email)
    email_cell.short_description = "Email"

    def vip_badge(self, obj):
        return format_html('<span style="background: rgba(245, 158, 11, 0.15); color: #D97706; font-weight: 800; padding: 2px 8px; border-radius: 4px; font-size: 11px;">VIP {}</span>', obj.vip_level)
    vip_badge.short_description = "VIP Tier"

    def role_badge(self, obj):
        if obj.is_admin:
            return format_html('<span style="background: rgba(3, 4, 94, 0.12); color: #03045E; font-weight: 800; padding: 2px 7px; border-radius: 4px; font-size: 11px;">SUPER ADMIN</span>')
        return format_html('<span style="background: rgba(0, 119, 182, 0.1); color: #0077B6; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 11px;">TRADER</span>')
    role_badge.short_description = "Role"

    def kyc_status_badge(self, obj):
        colors = {
            'verified': '#10B981',
            'pending': '#F59E0B',
            'rejected': '#EF4444',
            'unverified': '#64748B'
        }
        color = colors.get(obj.kyc_status, '#64748B')
        return format_html('<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">{}</span>', color, obj.kyc_status)
    kyc_status_badge.short_description = "KYC Status"

    def quick_actions(self, obj):
        if obj.kyc_status == 'pending':
            url = reverse('admin:kyc_queue')
            return format_html('<a href="{}" style="background: #0077B6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-decoration: none; font-weight: 600;">Review KYC</a>', url)
        return "-"
    quick_actions.short_description = "Review Action"
