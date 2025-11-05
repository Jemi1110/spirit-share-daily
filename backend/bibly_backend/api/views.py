from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models

from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class AllowOptionsPermission(BasePermission):
    """
    Custom permission to allow OPTIONS requests (for CORS preflight)
    and read-only access for anonymous users, even with invalid tokens
    """
    def has_permission(self, request, view):
        # Allow OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return True
        
        # Allow GET requests for all users (authenticated or not)
        # This includes cases where authentication failed due to invalid tokens
        if request.method in ['GET', 'HEAD']:
            return True
            
        # Require authentication for other methods
        return request.user and request.user.is_authenticated

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

from django.http import HttpResponse

def home(request):
    return HttpResponse("Welcome to Bibly Backend!")

from .models import (
    BibleVersion, Verse, Highlight, Devotional, StudyMaterial, Document,
    PrayerRequest, Post, Comment, Blog, BookHighlight, BookHighlightComment,
    ReadingProgress
)
from .serializers import (
    UserSerializer, UserRegistrationSerializer, BibleVersionSerializer,
    VerseSerializer, HighlightSerializer, DevotionalSerializer,
    StudyMaterialSerializer, DocumentSerializer, PrayerRequestSerializer, 
    PostSerializer, CommentSerializer, BlogSerializer, BookHighlightSerializer,
    BookHighlightCommentSerializer, ReadingProgressSerializer
)

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'put'])
    def profile(self, request):
        # Return a default profile for anonymous users
        if not request.user.is_authenticated:
            return Response({
                'id': 0,
                'username': 'Anonymous',
                'email': 'anonymous@example.com',
                'first_name': 'Anonymous',
                'last_name': 'User',
                'is_anonymous': True
            })
            
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        user_to_follow = self.get_object()
        request.user.following.add(user_to_follow)
        return Response({'status': 'following'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unfollow(self, request, pk=None):
        user_to_unfollow = self.get_object()
        request.user.following.remove(user_to_unfollow)
        return Response({'status': 'unfollowed'})

class BibleVersionViewSet(viewsets.ModelViewSet):
    queryset = BibleVersion.objects.all()
    serializer_class = BibleVersionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class VerseViewSet(viewsets.ModelViewSet):
    queryset = Verse.objects.all()
    serializer_class = VerseSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['text', 'book']
    
    def get_queryset(self):
        queryset = Verse.objects.all()
        book = self.request.query_params.get('book', None)
        chapter = self.request.query_params.get('chapter', None)
        verse = self.request.query_params.get('verse', None)
        
        if book:
            queryset = queryset.filter(book__icontains=book)
        if chapter:
            queryset = queryset.filter(chapter=chapter)
        if verse:
            queryset = queryset.filter(verse_number=verse)
        
        return queryset

class HighlightViewSet(viewsets.ModelViewSet):
    queryset = Highlight.objects.all()
    serializer_class = HighlightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Highlight.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DevotionalViewSet(viewsets.ModelViewSet):
    queryset = Devotional.objects.all()
    serializer_class = DevotionalSerializer
    permission_classes = [AllowOptionsPermission]
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=None)

class StudyMaterialViewSet(viewsets.ModelViewSet):
    queryset = StudyMaterial.objects.all()
    serializer_class = StudyMaterialSerializer
    permission_classes = [AllowOptionsPermission]
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=None)

class PrayerRequestViewSet(viewsets.ModelViewSet):
    queryset = PrayerRequest.objects.all()
    serializer_class = PrayerRequestSerializer
    permission_classes = [AllowOptionsPermission]
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            # For anonymous users, create with a default user or handle differently
            serializer.save(user=None)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pray(self, request, pk=None):
        prayer = self.get_object()
        prayer.prayed_by.add(request.user)
        return Response({'status': 'prayed'})

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [AllowOptionsPermission]
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=None)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        if request.user in post.likes.all():
            post.likes.remove(request.user)
            return Response({'status': 'unliked'})
        else:
            post.likes.add(request.user)
            return Response({'status': 'liked'})

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [AllowOptionsPermission]
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=None)

class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all()
    serializer_class = BlogSerializer
    permission_classes = [AllowOptionsPermission]
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=None)

class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user documents (PDFs, EPUBs, XMLs, etc.)"""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    
    def get_permissions(self):
        """Allow public documents to be viewed without authentication"""
        if self.action in ['list', 'retrieve'] and self.request.method == 'GET':
            return []  # No authentication required for viewing public documents
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # If user is authenticated, show their documents + public ones
        if self.request.user.is_authenticated:
            return Document.objects.filter(
                models.Q(owner=self.request.user) | 
                models.Q(collaborators=self.request.user) |
                models.Q(is_public=True)
            ).distinct()
        else:
            # If not authenticated, only show public documents
            return Document.objects.filter(is_public=True)
    
    def perform_create(self, serializer):
        # Auto-detect file type and Bible status
        file = self.request.FILES.get('file')
        if file:
            file_type = self.detect_file_type(file.name)
            is_bible = self.is_bible_file(file.name, file_type)
            
            # Parse content if it's a Bible
            parsed_content = None
            if is_bible:
                try:
                    parsed_content = self.parse_bible_content(file, file_type)
                except Exception as e:
                    print(f"Error parsing Bible content: {e}")
            
            serializer.save(
                owner=self.request.user,
                file_type=file_type,
                file_size=file.size,
                is_bible=is_bible,
                parsed_content=parsed_content
            )
        else:
            serializer.save(owner=self.request.user)
    
    def detect_file_type(self, filename):
        """Detect file type from filename"""
        extension = filename.lower().split('.')[-1]
        type_mapping = {
            'pdf': 'pdf',
            'epub': 'epub',
            'xml': 'xml',
            'json': 'json',
            'txt': 'txt'
        }
        return type_mapping.get(extension, 'txt')
    
    def is_bible_file(self, filename, file_type):
        """Determine if file is a Bible"""
        filename_lower = filename.lower()
        return (
            'bible' in filename_lower or 
            'biblia' in filename_lower or
            file_type in ['json', 'xml']
        )
    
    def parse_bible_content(self, file, file_type):
        """Parse Bible content from uploaded file"""
        content = file.read().decode('utf-8')
        file.seek(0)  # Reset file pointer
        
        if file_type == 'json':
            import json
            return json.loads(content)
        elif file_type == 'xml':
            # Store the full XML content for frontend parsing
            # The frontend has a more robust XML parser
            return {
                'raw_xml': content,
                'content_length': len(content),
                'is_xml': True,
                'parsing_note': 'XML content stored for frontend parsing'
            }
        
        return None
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share document with another user"""
        document = self.get_object()
        user_email = request.data.get('email')
        
        if document.owner != request.user:
            return Response(
                {'error': 'Only the owner can share documents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user_to_share = User.objects.get(email=user_email)
            document.collaborators.add(user_to_share)
            return Response({'status': 'shared', 'user': user_to_share.username})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def make_public(self, request, pk=None):
        """Make document public"""
        document = self.get_object()
        
        if document.owner != request.user:
            return Response(
                {'error': 'Only the owner can make documents public'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        document.is_public = not document.is_public
        document.save()
        
        return Response({
            'status': 'public' if document.is_public else 'private',
            'is_public': document.is_public
        })

class BookHighlightViewSet(viewsets.ModelViewSet):
    """ViewSet for managing book highlights (separate from Bible highlights)"""
    queryset = BookHighlight.objects.all()
    serializer_class = BookHighlightSerializer
    permission_classes = [AllowAny]  # Allow anonymous access like reading progress
    
    def get_queryset(self):
        document_id = self.request.query_params.get('document_id')
        chapter_number = self.request.query_params.get('chapter_number')
        user_id = self.request.query_params.get('user_id')
        
        queryset = BookHighlight.objects.select_related('user').prefetch_related('comments')
        
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        if chapter_number:
            queryset = queryset.filter(chapter_number=chapter_number)
            
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('chapter_number', 'start_offset')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Handle user assignment
        if request.user.is_authenticated:
            highlight = serializer.save(user=request.user)
        else:
            # For anonymous users, create a default user or handle differently
            from django.contrib.auth import get_user_model
            User = get_user_model()
            default_user, created = User.objects.get_or_create(
                username='anonymous',
                defaults={
                    'email': 'anonymous@example.com',
                    'first_name': 'Anonymous', 
                    'last_name': 'User'
                }
            )
            highlight = serializer.save(user=default_user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a book highlight"""
        highlight = self.get_object()
        
        comment_data = {
            'id': f"comment_{request.data.get('id', 'auto')}",
            'highlight': highlight.id,
            'user_name': request.data.get('user_name', 'Anonymous'),
            'text': request.data.get('text', '')
        }
        
        serializer = BookHighlightCommentSerializer(data=comment_data)
        serializer.is_valid(raise_exception=True)
        
        if request.user.is_authenticated:
            comment = serializer.save(user=request.user)
        else:
            # Use the same default user as the highlight
            comment = serializer.save(user=highlight.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ReadingProgressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reading progress - supports both authenticated and anonymous users"""
    serializer_class = ReadingProgressSerializer
    permission_classes = [AllowAny]  # Allow both authenticated and anonymous users
    
    def get_queryset(self):
        document_id = self.request.query_params.get('document_id')
        
        # Handle both authenticated and anonymous users
        if self.request.user.is_authenticated:
            queryset = ReadingProgress.objects.filter(user=self.request.user)
        else:
            # Use session key for anonymous users
            session_key = self.request.session.session_key
            if not session_key:
                self.request.session.create()
                session_key = self.request.session.session_key
            queryset = ReadingProgress.objects.filter(session_key=session_key)
        
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        return queryset.order_by('-last_read_at')
    
    def create(self, request, *args, **kwargs):
        # Update existing progress or create new one
        document_id = request.data.get('document_id')
        
        if request.user.is_authenticated:
            # Authenticated user
            progress, created = ReadingProgress.objects.update_or_create(
                user=request.user,
                document_id=document_id,
                defaults={
                    'current_chapter': request.data.get('current_chapter', 1),
                    'scroll_position': request.data.get('scroll_position', 0),
                    'total_chapters': request.data.get('total_chapters', 1),
                    'reading_time_minutes': request.data.get('reading_time_minutes', 0),
                }
            )
        else:
            # Anonymous user - use session
            if not request.session.session_key:
                request.session.create()
            
            progress, created = ReadingProgress.objects.update_or_create(
                session_key=request.session.session_key,
                document_id=document_id,
                defaults={
                    'current_chapter': request.data.get('current_chapter', 1),
                    'scroll_position': request.data.get('scroll_position', 0),
                    'total_chapters': request.data.get('total_chapters', 1),
                    'reading_time_minutes': request.data.get('reading_time_minutes', 0),
                }
            )
        
        serializer = self.get_serializer(progress)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        
        return Response(serializer.data, status=status_code)

# CSRF Token endpoint
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.middleware.csrf import get_token

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Provide CSRF token for frontend"""
    return JsonResponse({'csrfToken': get_token(request)})