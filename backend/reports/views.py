from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from datetime import timedelta
from projects.models import Project, Task, Sprint, TaskHistory

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
    def burndown(self, request):
        """Data for burndown chart"""
        sprint_id = request.query_params.get('sprint_id')
        if not sprint_id:
            return Response({'error': 'sprint_id is required'}, status=400)
            
        try:
            sprint = Sprint.objects.get(id=sprint_id)
        except Sprint.DoesNotExist:
            return Response({'error': 'Sprint not found'}, status=404)
            
        # Get all tasks that were ever in this sprint
        tasks = Task.objects.filter(sprint=sprint)
        total_points = sum(t.story_points for t in tasks)
        
        # Calculate ideal burndown
        days = (sprint.end_date - sprint.start_date).days + 1
        ideal_line = []
        for i in range(days):
            ideal_line.append({
                'day': (sprint.start_date + timedelta(days=i)).strftime('%Y-%m-%d'),
                'points': total_points - (total_points / (days - 1) * i) if days > 1 else 0
            })
            
        # Calculate actual burndown
        # We need TaskHistory entries for tasks in this sprint
        actual_line = []
        current_points = total_points
        
        for i in range(days):
            current_day = sprint.start_date + timedelta(days=i)
            # Find points completed on this day
            completed_that_day = TaskHistory.objects.filter(
                task__sprint=sprint,
                status='DONE',
                changed_at__date=current_day
            ).count() # This is a simplification; should use story_points
            
            # Better approach: sum story points of tasks that became DONE
            completed_points = TaskHistory.objects.filter(
                task__sprint=sprint,
                status='DONE',
                changed_at__date=current_day
            ).aggregate(total=Count('story_points'))['total'] or 0 # Wait, story_points is in TaskHistory now
            
            # Re-fetch with sum
            from django.db.models import Sum
            completed_points = TaskHistory.objects.filter(
                task__sprint=sprint,
                status='DONE',
                changed_at__date=current_day
            ).aggregate(total=Sum('story_points'))['total'] or 0
            
            current_points -= completed_points
            if current_day <= timezone.now().date():
                actual_line.append({
                    'day': current_day.strftime('%Y-%m-%d'),
                    'points': max(0, current_points)
                })
            
        return Response({
            'ideal': ideal_line,
            'actual': actual_line
        })

    @action(detail=False, methods=['get'])
    def velocity(self, request):
        """Average story points completed per sprint"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({'error': 'project_id is required'}, status=400)
            
        sprints = Sprint.objects.filter(project_id=project_id, status='COMPLETED').order_by('end_date')
        data = []
        
        from django.db.models import Sum
        for sprint in sprints:
            completed_points = Task.objects.filter(sprint=sprint, status='DONE').aggregate(total=Sum('story_points'))['total'] or 0
            data.append({
                'sprint': sprint.name,
                'points': completed_points
            })
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def workload(self, request):
        """Detailed workload by user"""
        project_id = request.query_params.get('project_id')
        projects = Project.objects.filter(members=request.user)
        if project_id:
            projects = projects.filter(id=project_id)
            
        from django.db.models import Sum
        distribution = Task.objects.filter(project__in=projects).exclude(assigned_to=None).values(
            'assigned_to__username', 'assigned_to__id'
        ).annotate(
            total_tasks=Count('id'),
            open_tasks=Count('id', filter=Q(status__in=['TODO', 'IN_PROGRESS'])),
            total_points=Sum('story_points'),
            open_points=Sum('story_points', filter=Q(status__in=['TODO', 'IN_PROGRESS']))
        )
        
        return Response(distribution)

    @action(detail=False, methods=['get'])
    def burnup(self, request):
        """Total scope vs completed scope over time"""
        sprint_id = request.query_params.get('sprint_id')
        if not sprint_id:
            return Response({'error': 'sprint_id is required'}, status=400)
            
        try:
            sprint = Sprint.objects.get(id=sprint_id)
        except Sprint.DoesNotExist:
            return Response({'error': 'Sprint not found'}, status=404)
            
        days = (sprint.end_date - sprint.start_date).days + 1
        data = []
        
        from django.db.models import Sum
        total_scope = Task.objects.filter(sprint=sprint).aggregate(total=Sum('story_points'))['total'] or 0
        completed_acc = 0
        
        for i in range(days):
            current_day = sprint.start_date + timedelta(days=i)
            if current_day > timezone.now().date():
                break
                
            completed_that_day = TaskHistory.objects.filter(
                task__sprint=sprint,
                status='DONE',
                changed_at__date=current_day
            ).aggregate(total=Sum('story_points'))['total'] or 0
            
            completed_acc += completed_that_day
            data.append({
                'day': current_day.strftime('%Y-%m-%d'),
                'total_scope': total_scope,
                'completed': completed_acc
            })
            
        return Response(data)
