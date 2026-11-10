from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SummarizeView,
    SuggestTasksView,
    BreakdownTaskView,
    PrioritizeTicketView,
    AIRequestLogViewSet,
    AIPromptTemplateViewSet
)

router = DefaultRouter()
router.register(r'logs', AIRequestLogViewSet, basename='ai-log')
router.register(r'templates', AIPromptTemplateViewSet, basename='ai-template')

urlpatterns = [
    path('summarize/', SummarizeView.as_view(), name='ai-summarize'),
    path('suggest-tasks/', SuggestTasksView.as_view(), name='ai-suggest-tasks'),
    path('breakdown/', BreakdownTaskView.as_view(), name='ai-breakdown'),
    path('prioritize-ticket/', PrioritizeTicketView.as_view(), name='ai-prioritize-ticket'),
    path('', include(router.urls)),
]

