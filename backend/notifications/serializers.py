from rest_framework import serializers
from .models import ActivityAlert, NotificationRule
from users.serializers import UserSerializer

class ActivityAlertSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ActivityAlert
        fields = ['id', 'user', 'activity_type', 'title', 'message', 'is_read', 'read_at', 'created_at']

class NotificationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRule
        fields = '__all__'
        read_only_fields = ['user']
