from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, F, Sum
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
from projects.models import Project, Task, Sprint, TaskHistory
from tickets.models import Ticket
import csv
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

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
        actual_line = []
        current_points = total_points
        
        for i in range(days):
            current_day = sprint.start_date + timedelta(days=i)
            
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
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export reports to CSV"""
        report_type = request.query_params.get('type', 'tasks')
        project_id = request.query_params.get('project_id')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        
        writer = csv.writer(response)
        
        if report_type == 'tasks':
            # Export tasks
            tasks = Task.objects.filter(project__members=request.user)
            if project_id:
                tasks = tasks.filter(project_id=project_id)
            
            writer.writerow(['ID', 'Title', 'Project', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Story Points'])
            for task in tasks:
                writer.writerow([
                    task.id,
                    task.title,
                    task.project.name,
                    task.status,
                    task.priority,
                    task.assigned_to.username if task.assigned_to else 'Unassigned',
                    task.due_date.strftime('%Y-%m-%d') if task.due_date else '',
                    task.story_points
                ])
        
        elif report_type == 'projects':
            # Export projects
            projects = Project.objects.filter(members=request.user)
            writer.writerow(['ID', 'Name', 'Status', 'Start Date', 'End Date', 'Total Tasks', 'Completed Tasks', 'Members'])
            for project in projects:
                total_tasks = project.tasks.count()
                completed = project.tasks.filter(status='DONE').count()
                writer.writerow([
                    project.id,
                    project.name,
                    project.status,
                    project.start_date.strftime('%Y-%m-%d'),
                    project.end_date.strftime('%Y-%m-%d') if project.end_date else '',
                    total_tasks,
                    completed,
                    project.members.count()
                ])
        
        elif report_type == 'workload':
            # Export workload
            projects = Project.objects.filter(members=request.user)
            if project_id:
                projects = projects.filter(id=project_id)
            
            distribution = Task.objects.filter(project__in=projects).exclude(assigned_to=None).values(
                'assigned_to__username'
            ).annotate(
                total_tasks=Count('id'),
                open_tasks=Count('id', filter=Q(status__in=['TODO', 'IN_PROGRESS'])),
                total_points=Sum('story_points')
            )
            
            writer.writerow(['User', 'Total Tasks', 'Open Tasks', 'Total Story Points'])
            for item in distribution:
                writer.writerow([
                    item['assigned_to__username'],
                    item['total_tasks'],
                    item['open_tasks'],
                    item['total_points'] or 0
                ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        """Export reports to PDF"""
        report_type = request.query_params.get('type', 'tasks')
        project_id = request.query_params.get('project_id')
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.pdf"'
        
        doc = SimpleDocTemplate(response, pagesize=landscape(letter))
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_text = f"{report_type.title()} Report"
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                title_text += f" - {project.name}"
            except Project.DoesNotExist:
                pass
        
        elements.append(Paragraph(title_text, styles['Title']))
        elements.append(Spacer(1, 20))
        
        data = []
        
        if report_type == 'tasks':
            # Header
            headers = ['ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Due Date']
            data.append(headers)
            
            # Content
            tasks = Task.objects.filter(project__members=request.user).distinct()
            if project_id:
                tasks = tasks.filter(project_id=project_id)
                
            for task in tasks:
                assignee = task.assigned_to.username if task.assigned_to else 'Unassigned'
                due_date = task.due_date.strftime('%Y-%m-%d') if task.due_date else '-'
                data.append([
                    str(task.id),
                    task.title[:30] + '...' if len(task.title) > 30 else task.title,
                    task.status,
                    task.priority,
                    assignee,
                    due_date
                ])
                
        elif report_type == 'projects':
            headers = ['Name', 'Status', 'Start Date', 'Tasks', 'Progress']
            data.append(headers)
            
            projects = Project.objects.filter(members=request.user).distinct()
            for p in projects:
                total = p.tasks.count()
                done = p.tasks.filter(status='DONE').count()
                progress = f"{int(done/total*100)}%" if total > 0 else "0%"
                start_date = p.start_date.strftime('%Y-%m-%d') if p.start_date else '-'
                
                data.append([
                    p.name,
                    p.status,
                    start_date,
                    f"{done}/{total}",
                    progress
                ])
        
        # Create Table
        if len(data) > 1:
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.gray),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph("No data found for this report.", styles['Normal']))
            
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Generated on {timezone.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        
        doc.build(elements)
        return response

    @action(detail=False, methods=['get'])
    def kpis(self, request):
        """Get Key Performance Indicators"""
        user = request.user
        projects = Project.objects.filter(members=user)
        tasks = Task.objects.filter(project__in=projects)
        
        now = timezone.now()
        start_of_week = now - timedelta(days=now.weekday())
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate KPIs
        kpis = {
            'task_completion_rate': {
                'label': 'Task Completion Rate',
                'value': 0,
                'unit': '%',
                'trend': 'up'
            },
            'average_velocity': {
                'label': 'Average Velocity',
                'value': 0,
                'unit': 'pts/sprint',
                'trend': 'up'
            },
            'on_time_delivery': {
                'label': 'On-Time Delivery',
                'value': 0,
                'unit': '%',
                'trend': 'up'
            },
            'team_utilization': {
                'label': 'Team Utilization',
                'value': 0,
                'unit': '%',
                'trend': 'neutral'
            }
        }
        
        # Task Completion Rate
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='DONE').count()
        if total_tasks > 0:
            kpis['task_completion_rate']['value'] = int((completed_tasks / total_tasks) * 100)
        
        # Average Velocity
        completed_sprints = Sprint.objects.filter(project__in=projects, status='COMPLETED')
        if completed_sprints.exists():
            total_velocity = 0
            for sprint in completed_sprints:
                points = Task.objects.filter(sprint=sprint, status='DONE').aggregate(total=Sum('story_points'))['total'] or 0
                total_velocity += points
            kpis['average_velocity']['value'] = int(total_velocity / completed_sprints.count())
        
        # On-Time Delivery
        completed_with_due_date = tasks.filter(status='DONE', due_date__isnull=False)
        if completed_with_due_date.exists():
            on_time = completed_with_due_date.filter(updated_at__lte=F('due_date')).count()
            kpis['on_time_delivery']['value'] = int((on_time / completed_with_due_date.count()) * 100)
        
        return Response(kpis)

