from rest_framework import viewsets, permissions, filters
from .models import Project, Task, Tag
from .serializers import ProjectSerializer, TaskSerializer, TagSerializer

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
        return Project.objects.filter(members=user)

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
            
        instance = serializer.save(created_by=self.request.user, key=key)
        instance.members.add(self.request.user)

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
