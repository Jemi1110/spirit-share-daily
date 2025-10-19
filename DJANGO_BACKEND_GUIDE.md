# Django Backend Setup Guide for Bibly

This guide provides detailed instructions for creating the Django REST Framework backend for the Bibly application.

## 1. Project Setup

### Install Dependencies
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install django djangorestframework djangorestframework-simplejwt
pip install django-cors-headers psycopg2-binary pillow
pip install drf-spectacular  # For API documentation
```

### Create Django Project
```bash
django-admin startproject bibly_backend
cd bibly_backend
python manage.py startapp api
```

## 2. Configure Settings (settings.py)

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    
    # Local
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be at top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
]

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Database (PostgreSQL recommended)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'bibly_db',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

## 3. Create Models (api/models.py)

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    """Extended User model"""
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following', blank=True)
    
    def __str__(self):
        return self.username

class BibleVersion(models.Model):
    """Bible version uploads"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    abbreviation = models.CharField(max_length=10)
    language = models.CharField(max_length=50, default='English')
    file = models.FileField(upload_to='bibles/', null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bible_versions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.abbreviation})"

class Verse(models.Model):
    """Individual Bible verses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bible_version = models.ForeignKey(BibleVersion, on_delete=models.CASCADE, related_name='verses')
    book = models.CharField(max_length=50)
    chapter = models.IntegerField()
    verse_number = models.IntegerField()
    text = models.TextField()
    
    class Meta:
        ordering = ['book', 'chapter', 'verse_number']
        unique_together = ['bible_version', 'book', 'chapter', 'verse_number']
    
    def __str__(self):
        return f"{self.book} {self.chapter}:{self.verse_number}"

class Highlight(models.Model):
    """User highlights and notes"""
    COLOR_CHOICES = [
        ('yellow', 'Yellow'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('pink', 'Pink'),
        ('orange', 'Orange'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='highlights')
    verse = models.ForeignKey(Verse, on_delete=models.CASCADE, related_name='highlights')
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='yellow')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.verse}"

class Devotional(models.Model):
    """User-created devotionals"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devotionals')
    verses = models.ManyToManyField(Verse, related_name='devotionals', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class StudyMaterial(models.Model):
    """Uploaded study materials"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='materials/', null=True, blank=True)
    link = models.URLField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='materials')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class PrayerRequest(models.Model):
    """Prayer requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prayer_requests')
    prayed_by = models.ManyToManyField(User, related_name='prayers_given', blank=True)
    is_answered = models.BooleanField(default=False)
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class Post(models.Model):
    """Social media posts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='posts/', null=True, blank=True)
    audio = models.FileField(upload_to='posts/audio/', null=True, blank=True)
    video = models.FileField(upload_to='posts/video/', null=True, blank=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"

class Comment(models.Model):
    """Comments on posts or verses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    verse = models.ForeignKey(Verse, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} - Comment"

class Blog(models.Model):
    """Long-form blog articles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blogs')
    image = models.ImageField(upload_to='blogs/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
```

## 4. Create Serializers (api/serializers.py)

```python
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
```

## 5. Create Views (api/views.py)

```python
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import (
    BibleVersion, Verse, Highlight, Devotional, StudyMaterial,
    PrayerRequest, Post, Comment, Blog
)
from .serializers import (
    UserSerializer, UserRegistrationSerializer, BibleVersionSerializer,
    VerseSerializer, HighlightSerializer, DevotionalSerializer,
    StudyMaterialSerializer, PrayerRequestSerializer, PostSerializer,
    CommentSerializer, BlogSerializer
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
    
    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def profile(self, request):
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
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class StudyMaterialViewSet(viewsets.ModelViewSet):
    queryset = StudyMaterial.objects.all()
    serializer_class = StudyMaterialSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PrayerRequestViewSet(viewsets.ModelViewSet):
    queryset = PrayerRequest.objects.all()
    serializer_class = PrayerRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pray(self, request, pk=None):
        prayer = self.get_object()
        prayer.prayed_by.add(request.user)
        return Response({'status': 'prayed'})

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
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
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all()
    serializer_class = BlogSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

## 6. Configure URLs (api/urls.py & main urls.py)

**api/urls.py:**
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, BibleVersionViewSet, VerseViewSet, HighlightViewSet,
    DevotionalViewSet, StudyMaterialViewSet, PrayerRequestViewSet,
    PostViewSet, CommentViewSet, BlogViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'bible/versions', BibleVersionViewSet)
router.register(r'verses', VerseViewSet)
router.register(r'highlights', HighlightViewSet)
router.register(r'devotionals', DevotionalViewSet)
router.register(r'materials', StudyMaterialViewSet)
router.register(r'prayers', PrayerRequestViewSet)
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'blogs', BlogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('users/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('users/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

**Main urls.py:**
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## 7. Run Migrations & Create Superuser

```bash
# Update AUTH_USER_MODEL in settings.py first
AUTH_USER_MODEL = 'api.User'

# Make migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## 8. Testing the API

Your API will be available at:
- **Base URL:** `http://localhost:8000/api/`
- **Documentation:** `http://localhost:8000/api/docs/`
- **Admin:** `http://localhost:8000/admin/`

## 9. Frontend Integration

Update the `BASE_URL` in your React frontend's `src/services/api.ts`:
```typescript
const BASE_URL = 'http://localhost:8000/api';
```

## 10. Production Deployment Checklist

- [ ] Set `DEBUG = False` in settings.py
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use environment variables for secrets
- [ ] Set up proper PostgreSQL database
- [ ] Configure static/media file storage (AWS S3, Cloudinary)
- [ ] Set up HTTPS
- [ ] Configure CORS properly for production domain
- [ ] Set up proper logging
- [ ] Implement rate limiting
- [ ] Add email verification
- [ ] Set up background tasks (Celery) for AI features

## Additional Features to Consider

1. **Email Verification**: Use django-allauth or custom implementation
2. **Social Authentication**: Google, Facebook OAuth
3. **File Upload Optimization**: Use django-storages with S3/Cloudinary
4. **Caching**: Redis for performance
5. **Real-time Features**: Django Channels for websockets
6. **Search**: Elasticsearch for advanced Bible search
7. **Analytics**: Track user engagement
8. **AI Integration**: OpenAI API for verse suggestions, image generation

---

Your Django backend is now ready to work with the React frontend! 🚀
