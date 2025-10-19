from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    BibleVersion, Verse, Highlight, Devotional, StudyMaterial,
    PrayerRequest, Post, Comment, Blog
)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'avatar', 'followers_count', 'following_count']
        read_only_fields = ['id']
    
    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_following_count(self, obj):
        return obj.following.count()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class BibleVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BibleVersion
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at']

class VerseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Verse
        fields = '__all__'
        read_only_fields = ['id']

class HighlightSerializer(serializers.ModelSerializer):
    verse_text = serializers.CharField(source='verse.text', read_only=True)
    
    class Meta:
        model = Highlight
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class DevotionalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    verses = VerseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Devotional
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class StudyMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyMaterial
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

class PrayerRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    prayer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PrayerRequest
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_prayer_count(self, obj):
        return obj.prayed_by.count()

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()

class BlogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Blog
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
