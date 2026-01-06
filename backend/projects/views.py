from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Project, Task, Tag, Milestone, ProjectCategory,
    Portfolio, Program, ProjectGoal, Deliverable
)
from .serializers import (
    ProjectSerializer, TaskSerializer, TagSerializer, MilestoneSerializer,
    ProjectCategorySerializer, PortfolioSerializer, ProgramSerializer,
    ProjectGoalSerializer, DeliverableSerializer
)

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
        if user.role and user.role.name == 'ADMIN':
            return Portfolio.objects.all()
        return Portfolio.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role and user.role.name == 'ADMIN':
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
        if user.role and user.role.name == 'ADMIN':
            return Project.objects.all()
        from django.db.models import Q
        return Project.objects.filter(
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

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return Milestone.objects.filter(project_id=project_id)
        return Milestone.objects.filter(project__members=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return Task.objects.filter(project_id=project_id)
        return Task.objects.all()
