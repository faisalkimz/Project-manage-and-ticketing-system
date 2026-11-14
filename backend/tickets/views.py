from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.utils import user_role_in
from .models import Ticket, TicketNote
from .serializers import TicketSerializer, TicketNoteSerializer
from projects.models import Task, Project

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = Ticket.objects.select_related('submitted_by', 'assigned_to', 'project_task')
        if user.is_superuser:
            return base_qs.all()

        from django.db.models import Q
        if user.enterprise:
            return base_qs.filter(
                Q(submitted_by__enterprise=user.enterprise) |
                Q(assigned_to__enterprise=user.enterprise)
            ).distinct()

        from projects.models import Project
        accessible_projects = Project.objects.filter(
            Q(members=user) | Q(team__members=user) | Q(created_by=user)
        ).values_list('id', flat=True)

        return base_qs.filter(
            Q(submitted_by=user) |
            Q(assigned_to=user) |
            Q(project_task__project_id__in=accessible_projects)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

    def perform_update(self, serializer):
        # We can track changes here to have the user context
        instance = serializer.save()
        # The signal in signals.py will handle the data tracking, 
        # but if we wanted to add the user to that log, we might need a different approach.
        # For MVP, we'll let the signal run, but we'll manually update the last log 
        # entry with the user if it was created in the same request.
        from activity.models import AuditLog
        from django.contrib.contenttypes.models import ContentType
        last_log = AuditLog.objects.filter(
            content_type=ContentType.objects.get_for_model(Ticket),
            object_id=instance.id
        ).order_by('-timestamp').first()
        
        if last_log and not last_log.user:
            last_log.user = self.request.user
            last_log.save()

    @action(detail=True, methods=['post'], url_path='convert-to-task')
    def convert_to_task(self, request, pk=None):
        ticket = self.get_object()
        project_id = request.data.get('project_id')
        
        if not project_id:
            return Response({'error': 'project_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.project_task:
            return Response({'error': 'Ticket already converted to task'}, status=status.HTTP_400_BAD_REQUEST)

        # Create Task from Ticket
        task = Task.objects.create(
            project=project,
            title=ticket.title,
            description=ticket.description,
            priority=ticket.priority,
            status='TODO',
            created_by=ticket.submitted_by or request.user
        )
        
        ticket.project_task = task
        ticket.status = 'IN_PROGRESS'
        ticket.save()
        
        return Response(TicketSerializer(ticket).data)

    @action(detail=False, methods=['post'], url_path='auto-escalate')
    def auto_escalate(self, request):
        """
        Cross-System SLA Intelligence & Auto-Escalation Engine:
        Scans all unresolved tickets that have breached SLA (or where sla_due_date < now),
        escalates them to CRITICAL priority, and automatically provisions an expedited linked Task
        in an active project for immediate engineering resolution.
        """
        from django.utils import timezone
        from django.db.models import Q
        now = timezone.now()
        
        breached_tickets = self.get_queryset().exclude(
            status__in=['RESOLVED', 'CLOSED']
        ).filter(
            Q(sla_breached=True) | (Q(sla_due_date__isnull=False) & Q(sla_due_date__lt=now))
        )
        
        target_project_id = request.data.get('project_id')
        target_project = None
        if target_project_id:
            target_project = Project.objects.filter(id=target_project_id).first()
        if not target_project:
            target_project = Project.objects.first()

        escalated_count = 0
        tasks_created_count = 0
        escalated_items = []

        for ticket in breached_tickets:
            dirty = False
            if not ticket.sla_breached:
                ticket.sla_breached = True
                dirty = True
            if not ticket.escalated:
                ticket.escalated = True
                ticket.escalation_reason = "Automated cross-system SLA breach escalation"
                ticket.escalated_at = now
                dirty = True
            if ticket.priority != 'CRITICAL':
                ticket.priority = 'CRITICAL'
                dirty = True
                escalated_count += 1
                
            # Cross-system linked task auto-creation if not linked yet
            if not ticket.project_task and target_project:
                task = Task.objects.create(
                    project=target_project,
                    title=f"[SLA ESCALATION] {ticket.title}",
                    description=f"Auto-generated from Breached Support Ticket #{ticket.ticket_number}\n\nCustomer Issue: {ticket.description}",
                    priority='CRITICAL',
                    status='TODO',
                    created_by=request.user
                )
                ticket.project_task = task
                dirty = True
                tasks_created_count += 1
                
            if dirty:
                ticket.save()
                escalated_items.append({
                    'id': ticket.id,
                    'ticket_number': ticket.ticket_number,
                    'title': ticket.title,
                    'priority': ticket.priority,
                    'linked_task_id': ticket.project_task.id if ticket.project_task else None
                })

        return Response({
            'success': True,
            'message': f"Cross-system SLA scan complete. Escalated {escalated_count} tickets to CRITICAL priority and auto-spawned {tasks_created_count} urgent project tasks.",
            'breached_total': breached_tickets.count(),
            'escalated_count': escalated_count,
            'tasks_created_count': tasks_created_count,
            'escalated_tickets': escalated_items
        })

    @action(detail=True, methods=['post'], url_path='add-note')
    def add_note(self, request, pk=None):
        ticket = self.get_object()
        note_text = request.data.get('note', '').strip()
        if not note_text:
            return Response({'error': 'Note content is required'}, status=status.HTTP_400_BAD_REQUEST)
        note = TicketNote.objects.create(
            ticket=ticket,
            author=request.user,
            note=note_text
        )
        return Response(TicketNoteSerializer(note).data, status=status.HTTP_201_CREATED)
