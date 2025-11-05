from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, BibleVersionViewSet, VerseViewSet, HighlightViewSet,
    DevotionalViewSet, StudyMaterialViewSet, DocumentViewSet, PrayerRequestViewSet,
    PostViewSet, CommentViewSet, BlogViewSet, CustomTokenObtainPairView,
    BookHighlightViewSet, ReadingProgressViewSet, get_csrf_token
)

router = DefaultRouter()
router.register(r'accounts', UserViewSet)  # Changed from 'users' to 'accounts'
router.register(r'bible/versions', BibleVersionViewSet)
router.register(r'verses', VerseViewSet)
router.register(r'highlights', HighlightViewSet)
router.register(r'devotionals', DevotionalViewSet)
router.register(r'materials', StudyMaterialViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'prayers', PrayerRequestViewSet)
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'blogs', BlogViewSet)
router.register(r'book-highlights', BookHighlightViewSet)
router.register(r'reading-progress', ReadingProgressViewSet, basename='reading-progress')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('csrf/', get_csrf_token, name='csrf-token'),
    path('', include(router.urls)),
]
