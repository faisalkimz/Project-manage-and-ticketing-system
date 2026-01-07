from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationRuleViewSet

router = DefaultRouter()
router.register(r'alerts', NotificationViewSet, basename='alert')
router.register(r'rules', NotificationRuleViewSet, basename='rule')

urlpatterns = [
    path('', include(router.urls)),
]
