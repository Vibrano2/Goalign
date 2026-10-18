from rest_framework.permissions import BasePermission

class IsSupport(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.groups.filter(name='SUPPORT').exists())

class IsKYCReviewer(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.groups.filter(name='KYC_REVIEWER').exists())

class IsFinanceOperator(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.groups.filter(name='FINANCE_OPERATOR').exists())

class IsGoalignAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.groups.filter(name='ADMIN').exists())

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        # Native Django superusers (is_superuser) do NOT automatically get Goalign financial bypass.
        # Must explicitly belong to the SUPERADMIN group.
        return bool(request.user and request.user.groups.filter(name='SUPERADMIN').exists())
