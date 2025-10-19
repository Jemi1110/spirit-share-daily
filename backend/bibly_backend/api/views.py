from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'  # Use email instead of username
    
    email = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                user = get_user_model().objects.get(email=email)
                if user.check_password(password) and user.is_active:
                    attrs['user'] = user
                    return super().validate(attrs)
                else:
                    self.fail('no_active_account')
            except get_user_model().DoesNotExist:
                self.fail('no_active_account')
        else:
            self.fail('no_credentials')
    
    def get_user(self):
        return self.validated_data['user']

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

from django.http import HttpResponse

def home(request):
    return HttpResponse("Welcome to Bibly Backend!")

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
