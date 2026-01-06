from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from datetime import timedelta
from projects.models import Project, Task
from tickets.models import Ticket
from timetracking.models import TimeEntry

class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Aggregate stats for the main dashboard"""
        user = request.user
        
        # Determine scope
        projects = Project.objects.filter(members=user)
        tasks = Task.objects.filter(project__in=projects)
        tickets = Ticket.objects.filter(Q(assigned_to=user) | Q(submitted_by=user))
        
        # KPI 1: Task Completion Rate (This Month)
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        created_this_month = tasks.filter(created_at__gte=start_of_month).count()
        completed_this_month = tasks.filter(status='DONE', updated_at__gte=start_of_month).count()
        
        # KPI 2: Ticket Resolution Time
        # This is expensive, simplified for now
        
        return Response({
            'total_projects': projects.count(),
            'active_projects': projects.filter(status='ACTIVE').count(),
            'total_tasks': tasks.count(),
            'my_open_tasks': tasks.filter(assigned_to=user, status__in=['TODO', 'IN_PROGRESS']).count(),
            'completion_rate_monthly': f"{int((completed_this_month / created_this_month * 100) if created_this_month > 0 else 0)}%",
            'open_tickets': tickets.filter(status='OPEN').count()
        })

    @action(detail=False, methods=['get'])
    def project_health(self, request):
        """Health metrics for all projects"""
        projects = Project.objects.filter(members=request.user)
        data = []
        
        for project in projects:
            total_tasks = project.tasks.count()
            completed = project.tasks.filter(status='DONE').count()
            overdue = project.tasks.filter(status__in=['TODO', 'IN_PROGRESS'], due_date__lt=timezone.now().date()).count()
            
            progress = int((completed / total_tasks * 100)) if total_tasks > 0 else 0
            
            # Determine health status dynamically
            health = 'ON_TRACK'
            if overdue > 5: health = 'AT_RISK'
            if overdue > 10: health = 'CRITICAL'
            
            data.append({
                'id': project.id,
                'name': project.name,
                'progress': progress,
                'total_tasks': total_tasks,
                'completed_tasks': completed,
                'overdue_tasks': overdue,
                'health': health,
                'members': project.members.count()
            })
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def workload(self, request):
        """Task distribution by user (Manager only ideally, but open for now)"""
        # Get tasks from projects I am a member of
        projects = Project.objects.filter(members=request.user)
        users_stats = {}
        
        tasks_scope = Task.objects.filter(project__in=projects)
        
        # Group by assignee
        distribution = tasks_scope.exclude(assigned_to=None).values(
            'assigned_to__username', 'assigned_to__id'
        ).annotate(
            total=Count('id'),
            pending=Count('id', filter=Q(status__in=['TODO', 'IN_PROGRESS']))
        )
        
        return Response(distribution)
