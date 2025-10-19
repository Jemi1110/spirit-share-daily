from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, BibleVersionViewSet, VerseViewSet, HighlightViewSet,
    DevotionalViewSet, StudyMaterialViewSet, PrayerRequestViewSet,
    PostViewSet, CommentViewSet, BlogViewSet, CustomTokenObtainPairView
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
    path('users/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('users/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
