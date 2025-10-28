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

from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse

User = get_user_model()

print("=== DEBUG AUTH SYSTEM ===")

# Check users in database
print("\n1. Users in database:")
users = User.objects.all()
if users:
    for user in users:
        print(f"   - Email: {user.email}, Username: {user.username}, Active: {user.is_active}")
else:
    print("   No users found!")

# Create test user if none exist
if not users:
    print("\n2. Creating test user...")
    test_user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    print(f"   Created: {test_user.email} / {test_user.username}")

# Test login endpoint
print("\n3. Testing login endpoint...")
client = Client()

# Test with correct credentials
login_data = {
    'email': 'test@example.com',
    'password': 'testpass123'
}

response = client.post('/api/users/login/', 
                      data=json.dumps(login_data),
                      content_type='application/json')

print(f"   Status Code: {response.status_code}")
print(f"   Response: {response.content.decode()}")

if response.status_code == 200:
    print("   ✅ Login successful!")
else:
    print("   ❌ Login failed!")
    
    # Test with Django's authenticate function
    from django.contrib.auth import authenticate
    user = authenticate(username='test@example.com', password='testpass123')
    print(f"   Django authenticate result: {user}")
    
    # Check if user exists and password is correct
    try:
        user = User.objects.get(email='test@example.com')
        print(f"   User exists: {user}")
        print(f"   Password check: {user.check_password('testpass123')}")
    except User.DoesNotExist:
        print("   User does not exist!")