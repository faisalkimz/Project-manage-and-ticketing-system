from rest_framework import serializers
from .models import Ticket
from users.serializers import UserSerializer
from projects.serializers import TaskSerializer, TagSerializer
from django.utils import timezone

class TicketSerializer(serializers.ModelSerializer):
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    project_task_details = TaskSerializer(source='project_task', read_only=True)
    tags_details = TagSerializer(source='tags', many=True, read_only=True)
    time_remaining_hours = serializers.SerializerMethodField()
    sla_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['ticket_number', 'submitted_by', 'sla_due_date', 'resolved_at']

    def get_time_remaining_hours(self, obj):
        if not obj.sla_due_date:
            return None
        
        # If resolved, time stops
        end_time = obj.resolved_at if obj.resolved_at else timezone.now()
        
        # Calculate diff
        diff = obj.sla_due_date - end_time
        return round(diff.total_seconds() / 3600, 1)

    def get_sla_status(self, obj):
        if not obj.sla_due_date:
            return 'NO_SLA'
            
        remaining = self.get_time_remaining_hours(obj)
        
        if obj.status in ['RESOLVED', 'CLOSED']:
            return 'MET' if remaining >= 0 else 'MISSED'
            
        if remaining < 0:
            return 'BREACHED'
        elif remaining < 4:
            return 'AT_RISK'
        else:
            return 'ON_TRACK'
