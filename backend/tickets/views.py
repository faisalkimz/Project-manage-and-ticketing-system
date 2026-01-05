from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket
from .serializers import TicketSerializer
from projects.models import Task, Project

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'DEVELOPER', 'PROJECT_MANAGER']:
            return Ticket.objects.all()
        return Ticket.objects.filter(submitted_by=user)

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

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
            status='TODO'
        )
        
        ticket.project_task = task
        ticket.status = 'IN_PROGRESS'
        ticket.save()
        
        return Response(TicketSerializer(ticket).data)
