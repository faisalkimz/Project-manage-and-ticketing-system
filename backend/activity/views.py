from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
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
            ticket_ct = ContentType.objects.filter(model='ticket').first()

            q_filter = Q(user=user)
            if project_ct:
                q_filter |= (Q(content_type=project_ct) & Q(object_id__in=accessible_projects))
            if task_ct:
                q_filter |= (Q(content_type=task_ct) & Q(object_id__in=accessible_task_ids))
            if ticket_ct:
                from tickets.models import Ticket
                accessible_ticket_ids = Ticket.objects.filter(
                    Q(submitted_by=user) | Q(assigned_to=user)
                ).values_list('id', flat=True)
                q_filter |= (Q(content_type=ticket_ct) & Q(object_id__in=accessible_ticket_ids))

            qs = AuditLog.objects.filter(q_filter).order_by('-timestamp')

        if content_type and object_id:
            qs = qs.filter(content_type__model=content_type, object_id=object_id)
        return qs

    @action(detail=False, methods=['get', 'post'], url_path='universal-timeline')
    def universal_timeline(self, request):
        """
        Universal Cross-System Activity Timeline:
        Returns aggregated events across Projects, Tasks, and Support Tickets.
        Supports POST or ?digest=true to synthesize an AI Executive Daily Digest.
        """
        from rest_framework.response import Response
        from django.utils import timezone
        
        event_filter = request.query_params.get('type', 'ALL').upper()
        logs_qs = self.get_queryset()

        if event_filter == 'TASKS':
            logs_qs = logs_qs.filter(content_type__model='task')
        elif event_filter == 'TICKETS':
            logs_qs = logs_qs.filter(content_type__model='ticket')
        elif event_filter == 'PROJECTS':
            logs_qs = logs_qs.filter(content_type__model='project')

        recent_logs = logs_qs[:60]
        serializer = AuditLogSerializer(recent_logs, many=True)

        if request.method == 'POST' or request.query_params.get('digest') == 'true':
            from ai_assistant.services import AIService
            entries = []
            for log in recent_logs[:25]:
                user_label = log.user.username if log.user else 'System'
                target_model = log.content_type.model.title() if log.content_type else 'Item'
                details_text = log.details.get('title') or log.details.get('status') or log.action
                entries.append(f"• [{log.timestamp.strftime('%H:%M')}] {user_label} {log.action} on {target_model} #{log.object_id}: {details_text}")
            
            context_text = "\n".join(entries) if entries else "Normal steady-state team sprint operations with active progress across tasks and tickets."
            prompt = (
                "You are an executive Chief of Staff. Generate an inspiring, structured Executive Daily Digest from the following cross-system team timeline activity:\n"
                f"{context_text}\n\n"
                "Provide:\n1. 🌟 Key Highlights & Milestones\n2. ⚡ Cross-System Velocity (Tasks & Tickets)\n3. ⚠️ Critical Items & Blockers\n4. 🎯 Next Action Items"
            )
            digest = AIService.generate_summary(prompt)
            return Response({
                'timeline': serializer.data,
                'digest': digest,
                'generated_at': timezone.now().isoformat(),
                'total_events': logs_qs.count()
            })

        return Response({
            'timeline': serializer.data,
            'total_events': logs_qs.count()
        })
