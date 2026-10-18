from django.contrib import admin
from django.urls import path
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok'})

admin.site.site_header = "Goalign Administration"
admin.site.site_title = "Goalign Admin Portal"
admin.site.index_title = "Goalign Control Center"

from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health_check, name='health_check'),
    path('api/health/', health_check, name='health_check_slash'),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/wallet/', include('apps.wallets.urls')),
    path('api/', include('apps.trading.urls')),
]
