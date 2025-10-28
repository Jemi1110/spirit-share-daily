# Django CORS Setup
# Add this to your Django settings.py

# 1. Install django-cors-headers
# pip install django-cors-headers

# 2. Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... your existing apps
    'corsheaders',
]

# 3. Add to MIDDLEWARE (at the top)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... your existing middleware
]

# 4. Add CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",  # Alternative localhost
]

# For development only (remove in production)
CORS_ALLOW_ALL_ORIGINS = True

# Allow credentials (for CSRF tokens)
CORS_ALLOW_CREDENTIALS = True

# Allow specific headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]