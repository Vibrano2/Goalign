from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from config.admin_site import super_admin_site

def health_check(request):
    return JsonResponse({'status': 'ok'})

# Synchronize all autodiscovered model admins into super_admin_site
admin.autodiscover()
for model, model_admin in admin.site._registry.items():
    model_admin.admin_site = super_admin_site
    super_admin_site._registry[model] = model_admin

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', super_admin_site.urls),
    path('api/health', health_check, name='health_check'),
    path('api/health/', health_check, name='health_check_slash'),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/wallet/', include('apps.wallets.urls')),
    path('api/', include('apps.trading.urls')),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'static')


