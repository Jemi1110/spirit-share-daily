#!/usr/bin/env python
import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bibly_backend.settings')
django.setup()

from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model

User = get_user_model()

def assign_user_to_groups():
    """Assign users to groups"""
    
    # Get groups
    moderators = Group.objects.get(name='Moderators')
    content_creators = Group.objects.get(name='Content Creators')
    premium_users = Group.objects.get(name='Premium Users')
    
    # Get users
    try:
        test_user = User.objects.get(email='test@example.com')
        admin_user = User.objects.get(email='admin@example.com')
        
        # Assign test user to Content Creators and Premium Users
        test_user.groups.add(content_creators, premium_users)
        print(f"✅ Assigned {test_user.email} to Content Creators and Premium Users")
        
        # Assign admin to all groups
        admin_user.groups.add(moderators, content_creators, premium_users)
        print(f"✅ Assigned {admin_user.email} to all groups")
        
    except User.DoesNotExist as e:
        print(f"❌ User not found: {e}")
    
    # Show updated user groups
    print("\n👥 Updated Users and Groups:")
    for user in User.objects.all():
        user_groups = user.groups.all()
        groups_list = [g.name for g in user_groups] if user_groups else ['No groups']
        print(f"   - {user.email}: {', '.join(groups_list)}")

if __name__ == '__main__':
    assign_user_to_groups()