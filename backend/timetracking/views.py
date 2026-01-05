from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TimeEntry
from .serializers import TimeEntrySerializer
from django.utils import timezone

class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = TimeEntry.objects.all()
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Default to showing own entries or all if admin/manager
        return TimeEntry.objects.filter(task__project__members=self.request.user)

    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        """Start a new timer for a task"""
        task_id = request.data.get('task_id')
        if not task_id:
            return Response({'error': 'Task ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Stop any currently running timer for this user
        running = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if running:
            running.end_time = timezone.now()
            running.is_running = False
            running.save()
            
        entry = TimeEntry.objects.create(
            user=request.user,
            task_id=task_id,
            start_time=timezone.now(),
            is_running=True
        )
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=['post'])
    def stop_timer(self, request):
        """Stop the currently running timer"""
        entry = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if not entry:
            return Response({'error': 'No running timer found'}, status=status.HTTP_404_NOT_FOUND)
            
        entry.end_time = timezone.now()
        entry.is_running = False
        entry.save()
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the currently running timer"""
        entry = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if not entry:
            return Response(None)
        return Response(TimeEntrySerializer(entry).data)
