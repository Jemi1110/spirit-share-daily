#!/usr/bin/env python
import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bibly_backend.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.auth import get_user_model

User = get_user_model()

def create_groups():
    """Create user groups for the Bibly app"""
    
    # Define groups and their permissions
    groups_data = {
        'Moderators': [
            'Can delete posts',
            'Can delete comments', 
            'Can change prayer requests'
        ],
        'Content Creators': [
            'Can add devotionals',
            'Can add blogs',
            'Can add study materials'
        ],
        'Premium Users': [
            'Can upload bible versions',
            'Can create unlimited highlights'
        ]
    }
    
    print("Creating Groups for Bibly App...")
    
    for group_name, permissions in groups_data.items():
        group, created = Group.objects.get_or_create(name=group_name)
        if created:
            print(f"✅ Created group: {group_name}")
        else:
            print(f"📝 Group already exists: {group_name}")
    
    # Show all groups
    print("\n📋 All Groups:")
    for group in Group.objects.all():
        print(f"   - {group.name}")
    
    # Show all users and their groups
    print("\n👥 Users and their Groups:")
    for user in User.objects.all():
        user_groups = user.groups.all()
        groups_list = [g.name for g in user_groups] if user_groups else ['No groups']
        print(f"   - {user.email} ({user.username}): {', '.join(groups_list)}")

if __name__ == '__main__':
    create_groups()