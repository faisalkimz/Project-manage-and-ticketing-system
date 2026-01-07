from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ActivityAlert, NotificationRule
from .serializers import ActivityAlertSerializer, NotificationRuleSerializer
from django.utils import timezone

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = ActivityAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ActivityAlert.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return Response({'status': 'success'})
        
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        alert = self.get_object()
        if not alert.is_read:
            alert.is_read = True
            alert.read_at = timezone.now()
            alert.save()
        return Response({'status': 'success'})

class NotificationRuleViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationRule.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
