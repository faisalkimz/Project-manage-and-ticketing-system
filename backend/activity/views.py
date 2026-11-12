from rest_framework import viewsets, permissions
from users.utils import user_role_in
from .models import Comment, Attachment, AuditLog
from .serializers import CommentSerializer, AttachmentSerializer, AuditLogSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Visibility logic for internal comments
        if not user_role_in(user, ['ADMIN', 'DEVELOPER', 'PROJECT_MANAGER']):
            queryset = queryset.filter(is_internal=False)
            
        content_type = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        if content_type and object_id:
            queryset = queryset.filter(content_type__model=content_type, object_id=object_id)
        return queryset

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all().order_by('-uploaded_at')
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        content_type = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        if content_type and object_id:
            queryset = queryset.filter(content_type__model=content_type, object_id=object_id)
        return queryset

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        content_type = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')

        if user.is_superuser:
            qs = AuditLog.objects.all().order_by('-timestamp')
        else:
            from projects.models import Project, Task
            from django.db.models import Q
            from django.contrib.contenttypes.models import ContentType

            if user.enterprise:
                accessible_projects = Project.objects.filter(
                    Q(team__enterprise=user.enterprise) | Q(members=user) | Q(created_by=user)
                ).values_list('id', flat=True)
            else:
                accessible_projects = Project.objects.filter(
                    Q(members=user) | Q(team__members=user) | Q(created_by=user)
                ).values_list('id', flat=True)

            accessible_task_ids = Task.objects.filter(
                Q(project_id__in=accessible_projects) | Q(assigned_to=user)
            ).values_list('id', flat=True)

            project_ct = ContentType.objects.filter(model='project').first()
            task_ct = ContentType.objects.filter(model='task').first()

            q_filter = Q(user=user)
            if project_ct:
                q_filter |= (Q(content_type=project_ct) & Q(object_id__in=accessible_projects))
            if task_ct:
                q_filter |= (Q(content_type=task_ct) & Q(object_id__in=accessible_task_ids))

            qs = AuditLog.objects.filter(q_filter).order_by('-timestamp')

        if content_type and object_id:
            qs = qs.filter(content_type__model=content_type, object_id=object_id)
        return qs
