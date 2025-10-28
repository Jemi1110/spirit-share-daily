# Django Backend for Highlights System
# Add this to your Django project

# models.py
from django.db import models
from django.contrib.auth.models import User
import uuid

class Document(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=500)
    file_path = models.CharField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Highlight(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    user_name = models.CharField(max_length=255)  # Denormalized for performance
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    text = models.TextField()
    color = models.CharField(max_length=50, default='yellow')
    chapter_number = models.IntegerField()
    start_offset = models.IntegerField(default=0)
    end_offset = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['document', 'user']),
            models.Index(fields=['document', 'chapter_number']),
        ]
    
    def __str__(self):
        return f"{self.user_name}: {self.text[:50]}..."

class HighlightComment(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4)
    highlight = models.ForeignKey(Highlight, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    user_name = models.CharField(max_length=255)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.user_name} on {self.highlight.text[:30]}..."

# serializers.py (Django REST Framework)
from rest_framework import serializers
from .models import Highlight, HighlightComment, Document

class HighlightCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HighlightComment
        fields = ['id', 'user_name', 'text', 'created_at']

class HighlightSerializer(serializers.ModelSerializer):
    comments = HighlightCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Highlight
        fields = [
            'id', 'user_name', 'text', 'color', 'chapter_number',
            'start_offset', 'end_offset', 'created_at', 'updated_at', 'comments'
        ]
    
    def create(self, validated_data):
        # Auto-assign user from request
        validated_data['user'] = self.context['request'].user
        validated_data['user_name'] = self.context['request'].user.get_full_name() or self.context['request'].user.username
        return super().create(validated_data)

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'name', 'created_at']

# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Highlight, HighlightComment, Document
from .serializers import HighlightSerializer, HighlightCommentSerializer, DocumentSerializer

class HighlightViewSet(viewsets.ModelViewSet):
    serializer_class = HighlightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        document_id = self.request.query_params.get('document_id')
        user_id = self.request.query_params.get('user_id')
        
        queryset = Highlight.objects.select_related('user', 'document').prefetch_related('comments')
        
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('chapter_number', 'start_offset')
    
    def create(self, request, *args, **kwargs):
        # Get or create document
        document_id = request.data.get('document_id', 'default')
        document, created = Document.objects.get_or_create(
            id=document_id,
            defaults={'name': f'Document {document_id}'}
        )
        
        # Add document to validated data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        highlight = serializer.save(document=document)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        highlight = self.get_object()
        
        comment_data = {
            'highlight': highlight.id,
            'user': request.user.id,
            'user_name': request.user.get_full_name() or request.user.username,
            'text': request.data.get('text', '')
        }
        
        serializer = HighlightCommentSerializer(data=comment_data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def by_document(self, request):
        """Get all highlights for a specific document"""
        document_id = request.query_params.get('document_id')
        if not document_id:
            return Response({'error': 'document_id is required'}, status=400)
        
        highlights = self.get_queryset().filter(document_id=document_id)
        serializer = self.get_serializer(highlights, many=True)
        
        return Response(serializer.data)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'highlights', views.HighlightViewSet, basename='highlight')
router.register(r'documents', views.DocumentViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]

# settings.py additions
INSTALLED_APPS = [
    # ... your existing apps
    'rest_framework',
    'corsheaders',  # For CORS if frontend is on different domain
    'channels',     # For WebSocket support (optional)
    'your_highlights_app',  # Your app name
]

MIDDLEWARE = [
    # ... your existing middleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

# CORS settings (if frontend is on different domain)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development server
    "https://your-frontend-domain.com",  # Production frontend
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# WebSocket support (optional - for real-time collaboration)
ASGI_APPLICATION = 'your_project.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

# consumers.py (WebSocket for real-time collaboration)
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Highlight

class HighlightConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.room_group_name = f'highlights_{self.document_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'highlight_message',
                'message': text_data_json
            }
        )

    async def highlight_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(message))

# routing.py (WebSocket routing)
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/highlights/(?P<document_id>\w+)/$', consumers.HighlightConsumer.as_asgi()),
]