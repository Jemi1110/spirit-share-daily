#!/usr/bin/env python
import os
import sys
import django
import json

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bibly_backend.settings')
django.setup()

from django.test import Client
from django.urls import reverse

print("=== TESTING LOGIN ENDPOINT DIRECTLY ===")

client = Client()

# Test the login endpoint
login_data = {
    'email': 'test@example.com',
    'password': 'testpass123'
}

print(f"Testing POST to /api/users/login/ with data: {login_data}")

response = client.post('/api/users/login/', 
                      data=json.dumps(login_data),
                      content_type='application/json')

print(f"Status Code: {response.status_code}")
print(f"Response Headers: {dict(response.items())}")
print(f"Response Content: {response.content.decode()}")

# Also test the URL resolution
try:
    from django.urls import resolve
    resolved = resolve('/api/users/login/')
    print(f"URL resolves to: {resolved.func} (view: {resolved.func.__name__})")
except Exception as e:
    print(f"URL resolution error: {e}")

# Test if the view is accessible directly
try:
    from api.views import CustomTokenObtainPairView
    view = CustomTokenObtainPairView()
    print(f"View class: {view.__class__}")
    print(f"Permission classes: {view.permission_classes}")
except Exception as e:
    print(f"View access error: {e}")