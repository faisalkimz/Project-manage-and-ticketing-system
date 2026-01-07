from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, AnnouncementViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'announcements', AnnouncementViewSet, basename='announcements')
router.register(r'chat', ChatMessageViewSet, basename='chat')

urlpatterns = router.urls
