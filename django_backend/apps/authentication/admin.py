from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.urls import reverse
from .models import GoalignProfile, GoalignAccount

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
    list_display = ('user', 'firebase_uid')
    search_fields = ('user__username', 'user__email', 'firebase_uid')
    readonly_fields = ('firebase_uid',)

@admin.register(GoalignAccount)
class GoalignAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'display_name', 'vip_level', 'kyc_status_badge', 'is_admin', 'created_at', 'quick_actions')
    list_filter = ('vip_level', 'is_admin', 'kyc_status')
    search_fields = ('email', 'display_name', 'firebase_uid', 'web3_eth_address')
    readonly_fields = ('firebase_uid', 'web3_eth_address', 'created_at', 'updated_at')

    def kyc_status_badge(self, obj):
        colors = {
            'verified': '#10B981',
            'pending': '#F59E0B',
            'rejected': '#EF4444',
            'unverified': '#64748B'
        }
        color = colors.get(obj.kyc_status, '#64748B')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase;">{}</span>', color, obj.kyc_status)
    kyc_status_badge.short_description = "KYC Status"

    def quick_actions(self, obj):
        if obj.kyc_status == 'pending':
            url = reverse('admin:kyc_queue')
            return format_html('<a href="{}" style="background: #087CCF; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Review KYC</a>', url)
        return "-"
    quick_actions.short_description = "Actions"

