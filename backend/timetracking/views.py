from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.utils import user_role_in
from .models import TimeEntry, WorkSchedule, ResourceHoliday
from .serializers import TimeEntrySerializer, WorkScheduleSerializer, ResourceHolidaySerializer
from django.utils import timezone
from django.db.models import Sum, Q

class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = TimeEntry.objects.all()
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user_role_in(user, ['ADMIN', 'PROJECT_MANAGER']):
            return TimeEntry.objects.all()
        # Allow users to see their own entries or entries for projects they are in
        return TimeEntry.objects.filter(Q(user=user) | Q(project__members=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        task_id = request.data.get('task_id')
        project_id = request.data.get('project_id')
        is_billable = request.data.get('is_billable', True)
        
        # Stop any currently running timer
        running = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if running:
            running.end_time = timezone.now()
            running.is_running = False
            running.save()
            
        entry = TimeEntry.objects.create(
            user=request.user,
            task_id=task_id,
            project_id=project_id,
            start_time=timezone.now(),
            is_running=True,
            is_billable=is_billable,
            is_manual=False
        )
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=['post'])
    def stop_timer(self, request):
        entry = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if not entry:
            return Response({'error': 'No running timer found'}, status=status.HTTP_404_NOT_FOUND)
            
        entry.end_time = timezone.now()
        entry.is_running = False
        entry.save()
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=['post'])
    def log_manual(self, request):
        """Log time manually"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, is_running=False, is_manual=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def current(self, request):
        entry = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if not entry:
            return Response(None)
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Time tracking stats for the user"""
        user = request.user
        today = timezone.now().date()
        week_start = today - timezone.timedelta(days=today.weekday())
        
        today_mins = TimeEntry.objects.filter(user=user, start_time__date=today).aggregate(total=Sum('duration_minutes'))['total'] or 0
        week_mins = TimeEntry.objects.filter(user=user, start_time__date__gte=week_start).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        return Response({
            'today_minutes': today_mins,
            'week_minutes': week_mins,
            'today_formatted': f"{today_mins // 60}h {today_mins % 60}m",
            'week_formatted': f"{week_mins // 60}h {week_mins % 60}m"
        })

class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if user_role_in(self.request.user, ['ADMIN', 'PROJECT_MANAGER']):
            return WorkSchedule.objects.all()
        return WorkSchedule.objects.filter(user=self.request.user)

class ResourceHolidayViewSet(viewsets.ModelViewSet):
    queryset = ResourceHoliday.objects.all()
    serializer_class = ResourceHolidaySerializer
    permission_classes = [IsAuthenticated]
