from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkflowRuleViewSet, WorkflowExecutionViewSet, WebhookViewSet,
    BackgroundJobViewSet, AutomationTemplateViewSet
)

router = DefaultRouter()
router.register(r'rules', WorkflowRuleViewSet, basename='workflow-rules')
router.register(r'executions', WorkflowExecutionViewSet, basename='workflow-executions')
router.register(r'webhooks', WebhookViewSet, basename='webhooks')
router.register(r'jobs', BackgroundJobViewSet, basename='background-jobs')
router.register(r'templates', AutomationTemplateViewSet, basename='automation-templates')

urlpatterns = [
    path('', include(router.urls)),
]
