from rest_framework import serializers
from .models import TimeEntry, WorkSchedule, ResourceHoliday
from users.serializers import UserSerializer
from projects.serializers import TaskSerializer, ProjectSerializer

class TimeEntrySerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    task_details = TaskSerializer(source='task', read_only=True)
    project_details = ProjectSerializer(source='project', read_only=True)
    
    class Meta:
        model = TimeEntry
        fields = '__all__'
        read_only_fields = ['user', 'is_running', 'duration_minutes']

class ResourceHolidaySerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = ResourceHoliday
        fields = '__all__'

class WorkScheduleSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = WorkSchedule
        fields = '__all__'
