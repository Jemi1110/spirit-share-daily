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

print("=== TESTING CORRECT AUTH ENDPOINT ===")

client = Client()

# Test the NEW auth endpoint
login_data = {
    'email': 'test@example.com',
    'password': 'testpass123'
}

print(f"Testing POST to /api/auth/login/ with data: {login_data}")

response = client.post('/api/auth/login/', 
                      data=json.dumps(login_data),
                      content_type='application/json')

print(f"Status Code: {response.status_code}")
print(f"Response Content: {response.content.decode()}")

if response.status_code == 200:
    print("✅ Login successful!")
    try:
        data = json.loads(response.content.decode())
        print(f"Access Token: {data.get('access', 'Not found')[:50]}...")
        print(f"Refresh Token: {data.get('refresh', 'Not found')[:50]}...")
    except:
        print("Could not parse JSON response")
else:
    print("❌ Login failed!")