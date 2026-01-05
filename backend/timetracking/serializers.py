from rest_framework import serializers
from .models import TimeEntry
from users.serializers import UserSerializer

class TimeEntrySerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = TimeEntry
        fields = '__all__'
        read_only_fields = ['user', 'is_running', 'duration_minutes']
