from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, AnnouncementViewSet, ChatMessageViewSet, DirectMessageViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'announcements', AnnouncementViewSet, basename='announcements')
router.register(r'chat', ChatMessageViewSet, basename='chat')
router.register(r'dms', DirectMessageViewSet, basename='dms')

urlpatterns = router.urls
