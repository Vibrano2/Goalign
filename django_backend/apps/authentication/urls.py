from django.urls import path
from .views import SyncUserView, CurrentUserView

urlpatterns = [
    path('sync', SyncUserView.as_view(), name='auth_sync'),
    path('sync/', SyncUserView.as_view(), name='auth_sync_slash'),
    path('me', CurrentUserView.as_view(), name='auth_me'),
    path('me/', CurrentUserView.as_view(), name='auth_me_slash'),
]
