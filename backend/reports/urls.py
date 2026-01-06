from rest_framework.routers import DefaultRouter
from .views import ReportsViewSet

router = DefaultRouter()
router.register(r'analytics', ReportsViewSet, basename='analytics')

urlpatterns = router.urls
