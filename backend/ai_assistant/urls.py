from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.AIPromptTemplateViewSet)
router.register(r'requests', views.AIRequestLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
