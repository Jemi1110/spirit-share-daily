#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bibly_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check if test user exists
test_email = 'test@example.com'
test_username = 'testuser'
test_password = 'testpass123'

if User.objects.filter(email=test_email).exists():
    print(f"Test user with email {test_email} already exists")
else:
    # Create test user
    user = User.objects.create_user(
        username=test_username,
        email=test_email,
        password=test_password
    )
    print(f"Created test user: {test_email} / {test_username}")
    print(f"Password: {test_password}")

# List all users
print("\nAll users in database:")
for user in User.objects.all():
    print(f"- {user.email} ({user.username})")