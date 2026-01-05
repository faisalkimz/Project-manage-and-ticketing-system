from rest_framework import serializers
from .models import Ticket
from users.serializers import UserSerializer
from projects.serializers import TaskSerializer, TagSerializer

class TicketSerializer(serializers.ModelSerializer):
    submitted_by_details = UserSerializer(source='submitted_by', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    project_task_details = TaskSerializer(source='project_task', read_only=True)
    tags_details = TagSerializer(source='tags', many=True, read_only=True)
    
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['ticket_number', 'submitted_by']
