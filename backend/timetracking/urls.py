from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimeEntryViewSet, WorkScheduleViewSet, ResourceHolidayViewSet

router = DefaultRouter()
router.register(r'entries', TimeEntryViewSet, basename='time-entries')
router.register(r'schedules', WorkScheduleViewSet, basename='work-schedules')
router.register(r'holidays', ResourceHolidayViewSet, basename='resource-holidays')

urlpatterns = [
    path('', include(router.urls)),
]
