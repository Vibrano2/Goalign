from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
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

@admin.register(GoalignAccount)
class GoalignAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'display_name', 'vip_level', 'is_admin', 'kyc_status', 'created_at')
    list_filter = ('vip_level', 'is_admin', 'kyc_status')
    search_fields = ('email', 'display_name', 'firebase_uid', 'web3_eth_address')
    readonly_fields = ('created_at', 'updated_at')
