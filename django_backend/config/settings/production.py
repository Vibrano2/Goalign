from .base import *
import sys

DEBUG = False

from urllib.parse import urlparse

ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', '*').split(',') if h.strip()]

cors_origins = [o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if o.strip()]
if cors_origins:
    CORS_ALLOWED_ORIGINS = cors_origins
else:
    CORS_ALLOW_ALL_ORIGINS = True

database_url = os.getenv('DATABASE_URL')
if database_url:
    url = urlparse(database_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 5432,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME') or os.getenv('PGDATABASE'),
            'USER': os.getenv('DB_USER') or os.getenv('PGUSER'),
            'PASSWORD': os.getenv('DB_PASSWORD') or os.getenv('PGPASSWORD', ''),
            'HOST': os.getenv('DB_HOST') or os.getenv('PGHOST', 'localhost'),
            'PORT': os.getenv('DB_PORT') or os.getenv('PGPORT', '5432'),
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
