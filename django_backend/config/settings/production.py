from .base import *
import sys

DEBUG = False

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
    print("FATAL: ALLOWED_HOSTS is not configured.")
    sys.exit(1)

CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

if not DATABASES['default']['NAME']:
    print("FATAL: Database configuration is missing.")
    sys.exit(1)

ENABLE_MOCK_FINANCE = os.getenv('ENABLE_MOCK_FINANCE', 'false').lower() == 'true'
if ENABLE_MOCK_FINANCE:
    print("FATAL: ENABLE_MOCK_FINANCE must not be true in production.")
    sys.exit(1)

# Security Settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_CONTENT_TYPE_NOSNIFF = True
