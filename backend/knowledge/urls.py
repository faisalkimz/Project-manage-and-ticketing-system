from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, WikiPageViewSet, FolderViewSet, SavedViewViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='documents')
router.register(r'wiki', WikiPageViewSet, basename='wiki')
router.register(r'folders', FolderViewSet, basename='folders')
router.register(r'saved-views', SavedViewViewSet, basename='saved-views')

urlpatterns = [
    path('', include(router.urls)),
]
