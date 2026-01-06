from rest_framework import viewsets, permissions
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
        if not (user.role and user.role.name in ['ADMIN', 'DEVELOPER', 'PROJECT_MANAGER']):
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
        queryset = super().get_queryset()
        content_type = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        if content_type and object_id:
            queryset = queryset.filter(content_type__model=content_type, object_id=object_id)
        return queryset
