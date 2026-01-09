from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from users.utils import user_has_role, user_role_in
from django.utils import timezone
from django.db.models import Q
from activity.models import AuditLog
from .models import (
    Project, Task, Tag, Milestone, ProjectCategory,
    Portfolio, Program, ProjectGoal, Deliverable, ProjectStatus, Sprint,
    Release, SprintRetrospective, SprintCapacity, TaskHistory
)
from .serializers import (
    ProjectSerializer, TaskSerializer, TagSerializer, MilestoneSerializer,
    ProjectCategorySerializer, PortfolioSerializer, ProgramSerializer,
    ProjectGoalSerializer, DeliverableSerializer, ProjectStatusSerializer,
    SprintSerializer, ReleaseSerializer, SprintRetrospectiveSerializer,
    SprintCapacitySerializer, ReminderSerializer
)
# Import Ticket model lazily to avoid circular imports in some test setups
try:
    from tickets.models import Ticket
except Exception:
    Ticket = None

class ProjectCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class PortfolioViewSet(viewsets.ModelViewSet):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Support both the old Role FK and the newer string 'role' field
        is_admin = user_has_role(user, 'ADMIN')

        if is_admin:
            return Portfolio.objects.all()
        return Portfolio.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def link_projects(self, request, pk=None):
        portfolio = self.get_object()
        project_ids = request.data.get('project_ids', [])
        Project.objects.filter(id__in=project_ids).update(portfolio=portfolio)
        return Response({'status': 'Projects linked successfully'})

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = user_has_role(user, 'ADMIN')

        if is_admin:
            return Program.objects.all()
        return Program.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ProjectGoalViewSet(viewsets.ModelViewSet):
    queryset = ProjectGoal.objects.all()
    serializer_class = ProjectGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return ProjectGoal.objects.filter(project_id=project_id)
        return ProjectGoal.objects.all()

class DeliverableViewSet(viewsets.ModelViewSet):
    queryset = Deliverable.objects.all()
    serializer_class = DeliverableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return Deliverable.objects.filter(project_id=project_id)
        return Deliverable.objects.all()

class ProjectStatusViewSet(viewsets.ModelViewSet):
    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return ProjectStatus.objects.filter(project_id=project_id)
        return ProjectStatus.objects.all()

class SprintViewSet(viewsets.ModelViewSet):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        user = self.request.user
        qs = Sprint.objects.all()
        
        if user.enterprise:
            qs = qs.filter(project__team__enterprise=user.enterprise)
            
        if project_id:
            return qs.filter(project_id=project_id)
        return qs

    @action(detail=True, methods=['post'])
    def start_sprint(self, request, pk=None):
        sprint = self.get_object()
        # Deactivate other active sprints in this project
        Sprint.objects.filter(project=sprint.project, status='ACTIVE').update(status='COMPLETED')
        sprint.status = 'ACTIVE'
        sprint.save()
        return Response({'status': 'Sprint started'})

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        user = self.request.user
        is_admin = user_has_role(user, 'ADMIN')

        if is_admin:
            return Project.objects.all()
            
        from django.db.models import Q
        base_query = Project.objects.all()
        
        # Filter by Enterprise if user belongs to one
        if user.enterprise:
            return base_query.filter(
                Q(team__enterprise=user.enterprise) | Q(members=user) | Q(created_by=user)
            ).distinct()
            
        return base_query.filter(
            Q(members=user) | Q(team__members=user) | Q(created_by=user)
        ).distinct()

    def perform_create(self, serializer):
        # Generate a simple key if not provided (e.g., from first 3 letters of name)
        name = self.request.data.get('name', 'PRJ')
        key = self.request.data.get('key')
        if not key:
            key = (name[:3].upper() if len(name) >= 3 else name.upper())
            # Ensure uniqueness (simple way for now)
            import random, string
            suffix = ''.join(random.choices(string.digits, k=2))
            key = f"{key}{suffix}"
        
        team_id = self.request.data.get('team_id')
        team = None
        if team_id:
            try:
                from users.models import Team
                team = Team.objects.get(id=team_id, members=self.request.user)
            except Exception:
                pass
            
        instance = serializer.save(created_by=self.request.user, key=key, team=team)
        instance.members.add(self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)
        from users.models import CustomUser
        try:
            user_to_add = CustomUser.objects.get(id=user_id)
            project.members.add(user_to_add)
            return Response({'status': 'member added'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'user not found'}, status=404)

    @action(detail=True, methods=['post'])
    def toggle_watch(self, request, pk=None):
        project = self.get_object()
        user = request.user
        if user in project.watchers.all():
            project.watchers.remove(user)
            return Response({'status': 'unwatched', 'is_watching': False})
        else:
            project.watchers.add(user)
            return Response({'status': 'watched', 'is_watching': True})

    @action(detail=True, methods=['post'])
    def toggle_star(self, request, pk=None):
        project = self.get_object()
        user = request.user
        if user in project.starred_by.all():
            project.starred_by.remove(user)
            return Response({'status': 'unstarred', 'is_starred': False})
        else:
            project.starred_by.add(user)
            return Response({'status': 'starred', 'is_starred': True})

    @action(detail=True, methods=['get'])
    def recent_activity(self, request, pk=None):
        project = self.get_object()
        from activity.models import AuditLog
        from django.contrib.contenttypes.models import ContentType
        from django.db.models import Q
        
        task_ct = ContentType.objects.get_for_model(Task)
        project_ct = ContentType.objects.get_for_model(Project)
        
        task_ids = project.tasks.values_list('id', flat=True)
        
        logs = AuditLog.objects.filter(
            (Q(content_type=task_ct) & Q(object_id__in=task_ids)) |
            (Q(content_type=project_ct) & Q(object_id=project.id))
        ).order_by('-timestamp')[:20]
        
        from activity.serializers import AuditLogSerializer
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        user = self.request.user
        qs = Milestone.objects.all()
        
        if user.enterprise:
            qs = qs.filter(project__team__enterprise=user.enterprise)
            
        if project_id:
            return qs.filter(project_id=project_id)
        return qs.filter(project__members=user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        user = self.request.user
        
        qs = Task.objects.all()
        if user.enterprise:
            qs = qs.filter(project__team__enterprise=user.enterprise)
            
        if project_id:
            return qs.filter(project_id=project_id)
        return qs


    def perform_create(self, serializer):
        instance = serializer.save()
        TaskHistory.objects.create(
            task=instance,
            status=instance.status,
            story_points=instance.story_points,
            changed_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def toggle_watch(self, request, pk=None):
        task = self.get_object()
        user = request.user
        if user in task.watchers.all():
            task.watchers.remove(user)
            return Response({'status': 'unwatched'})
        else:
            task.watchers.add(user)
            return Response({'status': 'watched'})

    def perform_update(self, serializer):
        from activity.models import AuditLog
        from django.contrib.contenttypes.models import ContentType
        
        old_instance = self.get_object()
        new_instance = serializer.save()
        
        # Track changes for audit log
        changes = {}
        for field in serializer.validated_data:
            old_val = getattr(old_instance, field)
            new_val = getattr(new_instance, field)
            if old_val != new_val:
                changes[field] = {
                    'old': str(old_val),
                    'new': str(new_val)
                }
        
        if changes:
            AuditLog.objects.create(
                user=self.request.user,
                action='UPDATE_TASK',
                content_type=ContentType.objects.get_for_model(Task),
                object_id=new_instance.id,
                details=changes
            )
            
            # Populate TaskHistory for Agile reporting if status or story_points changed
            if 'status' in changes or 'story_points' in changes:
                TaskHistory.objects.create(
                    task=new_instance,
                    status=new_instance.status,
                    story_points=new_instance.story_points,
                    changed_by=self.request.user
                )
        
        # Handle Task Recurrence
        if 'status' in changes and changes['status']['new'] == 'DONE' and new_instance.is_recurring:
            from django.utils import timezone
            from datetime import timedelta
            
            new_due_date = None
            if new_instance.due_date:
                if new_instance.recurrence_rule == 'DAILY':
                    new_due_date = new_instance.due_date + timedelta(days=1)
                elif new_instance.recurrence_rule == 'WEEKLY':
                    new_due_date = new_instance.due_date + timedelta(weeks=1)
                elif new_instance.recurrence_rule == 'MONTHLY':
                    # Simple monthly addition
                    new_due_date = new_instance.due_date + timedelta(days=30)
            
            # Create the next recurrence
            Task.objects.create(
                project=new_instance.project,
                title=new_instance.title,
                description=new_instance.description,
                status='TODO',
                priority=new_instance.priority,
                issue_type=new_instance.issue_type,
                story_points=new_instance.story_points,
                due_date=new_due_date,
                is_recurring=True,
                recurrence_rule=new_instance.recurrence_rule,
                assigned_to=new_instance.assigned_to,
                milestone=new_instance.milestone
            )
            
            # Disable recurrence on the completed task instance
            new_instance.is_recurring = False
            new_instance.save()

    @action(detail=False, methods=['post'])
    def bulk_operation(self, request):
        ids = request.data.get('ids', [])
        operation = request.data.get('operation') # 'archive', 'delete', 'update_status'
        value = request.data.get('value')
        
        queryset = Task.objects.filter(id__in=ids)
        
        if operation == 'archive':
            queryset.update(is_archived=True)
        elif operation == 'delete':
            queryset.delete()
        elif operation == 'update_status':
            queryset.update(status=value)
            
        return Response({'status': 'Bulk operation successful'})

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        task = self.get_object()
        AuditLog.objects.create(user=request.user, action='ACKNOWLEDGE_TASK', content_object=task, details={})
        return Response({'status': 'acknowledged'})

    @action(detail=True, methods=['post'])
    def snooze(self, request, pk=None):
        task = self.get_object()
        duration = request.data.get('duration', 1)
        unit = request.data.get('unit', 'days')
        try:
            dur = int(duration)
        except Exception:
            return Response({'error': 'invalid duration'}, status=400)
        from datetime import timedelta
        delta = timedelta(days=dur) if unit == 'days' else timedelta(hours=dur)
        if task.due_date:
            task.due_date = task.due_date + delta
        else:
            task.due_date = timezone.now() + delta
        task.save()
        TaskHistory.objects.create(task=task, status=task.status, story_points=task.story_points, changed_by=request.user)
        AuditLog.objects.create(user=request.user, action='SNOOZE_TASK', content_object=task, details={'duration': dur, 'unit': unit})
        return Response({'status': 'snoozed', 'due_date': task.due_date})

    @action(detail=True, methods=['post'])
    def mark_done(self, request, pk=None):
        task = self.get_object()
        task.status = 'DONE'
        task.save()
        TaskHistory.objects.create(task=task, status=task.status, story_points=task.story_points, changed_by=request.user)
        AuditLog.objects.create(user=request.user, action='MARK_DONE_TASK', content_object=task, details={})
        return Response({'status': 'marked_done'})


class RemindersViewSet(viewsets.ViewSet):
    """Endpoint that aggregates critical reminders from Tasks and Tickets"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        window = request.query_params.get('window')
        try:
            window_days = int(window) if window else 1
        except Exception:
            window_days = 1

        from datetime import timedelta
        now = timezone.now()
        window_dt = now + timedelta(days=window_days)
        items = []

        # Tasks
        tasks_qs = Task.objects.filter(is_archived=False).filter(
            Q(priority='CRITICAL') | Q(due_date__lte=window_dt)
        ).exclude(status='DONE').order_by('due_date')[:50]
        for t in tasks_qs:
            items.append({
                'id': t.id,
                'type': 'task',
                'title': t.title,
                'priority': t.priority,
                'due_date': t.due_date,
                'link': f"/projects/{t.project.id}/tasks/{t.id}" if t.project else f"/tasks/{t.id}",
                'assigned_to_details': t.assigned_to,
                'ticket_number': None,
                'is_overdue': bool(t.due_date and t.due_date < now)
            })

        # Tickets (if available)
        if Ticket:
            tickets_qs = Ticket.objects.filter().filter(
                Q(priority='CRITICAL') | Q(sla_due_date__lte=window_dt)
            ).exclude(status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]).order_by('sla_due_date')[:50]
            for tk in tickets_qs:
                items.append({
                    'id': tk.id,
                    'type': 'ticket',
                    'title': tk.title,
                    'priority': tk.priority,
                    'due_date': tk.sla_due_date,
                    'link': f"/tickets/{tk.id}",
                    'assigned_to_details': tk.assigned_to,
                    'ticket_number': tk.ticket_number,
                    'is_overdue': bool(tk.sla_due_date and tk.sla_due_date < now)
                })

        serializer = ReminderSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

class ReleaseViewSet(viewsets.ModelViewSet):
    queryset = Release.objects.all()
    serializer_class = ReleaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        user = self.request.user
        qs = Release.objects.all()
        if user.enterprise:
            qs = qs.filter(project__team__enterprise=user.enterprise)
        if project_id:
            return qs.filter(project_id=project_id)
        return qs

class SprintRetrospectiveViewSet(viewsets.ModelViewSet):
    queryset = SprintRetrospective.objects.all()
    serializer_class = SprintRetrospectiveSerializer
    permission_classes = [permissions.IsAuthenticated]

class SprintCapacityViewSet(viewsets.ModelViewSet):
    queryset = SprintCapacity.objects.all()
    serializer_class = SprintCapacitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        sprint_id = self.request.query_params.get('sprint_id')
        if sprint_id:
            return SprintCapacity.objects.filter(sprint_id=sprint_id)
        return SprintCapacity.objects.all()

