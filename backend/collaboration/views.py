from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, Announcement, ChatMessage
from .serializers import NotificationSerializer, AnnouncementSerializer, ChatMessageSerializer
from django.contrib.contenttypes.models import ContentType

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project_id')
        from projects.models import Project
        from django.db.models import Q

        if user.is_superuser:
            qs = Announcement.objects.all()
        elif getattr(user, 'enterprise', None):
            accessible_project_ids = Project.objects.filter(
                Q(team__enterprise=user.enterprise) | Q(members=user) | Q(created_by=user)
            ).values_list('id', flat=True)
            qs = Announcement.objects.filter(project_id__in=accessible_project_ids)
        else:
            accessible_project_ids = Project.objects.filter(
                Q(members=user) | Q(team__members=user) | Q(created_by=user)
            ).values_list('id', flat=True)
            qs = Announcement.objects.filter(project_id__in=accessible_project_ids)

        if project_id:
            return qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        content_type = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        if content_type and object_id:
            return ChatMessage.objects.filter(
                content_type__model=content_type,
                object_id=object_id
            )
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
