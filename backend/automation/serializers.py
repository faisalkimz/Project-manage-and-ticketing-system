from rest_framework import serializers
from .models import WorkflowRule, WorkflowExecution, Webhook, WebhookLog, BackgroundJob, AutomationTemplate
from django.contrib.auth import get_user_model

User = get_user_model()

class WorkflowRuleSerializer(serializers.ModelSerializer):
    created_by_details = serializers.SerializerMethodField()
    target_model = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowRule
        fields = '__all__'
        read_only_fields = ['created_by', 'execution_count', 'last_executed', 'created_at', 'updated_at']
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'username': obj.created_by.username}
        return None
    
    def get_target_model(self, obj):
        return obj.target_content_type.model if obj.target_content_type else None

class WorkflowExecutionSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    triggered_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowExecution
        fields = '__all__'
        read_only_fields = ['executed_at']
    
    def get_triggered_by_details(self, obj):
        if obj.triggered_by_user:
            return {'id': obj.triggered_by_user.id, 'username': obj.triggered_by_user.username}
        return None

class WebhookSerializer(serializers.ModelSerializer):
    created_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Webhook
        fields = '__all__'
        read_only_fields = ['created_by', 'success_count', 'failure_count', 'last_triggered', 'created_at']
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'username': obj.created_by.username}
        return None

class WebhookLogSerializer(serializers.ModelSerializer):
    webhook_name = serializers.CharField(source='webhook.name', read_only=True)
    
    class Meta:
        model = WebhookLog
        fields = '__all__'
        read_only_fields = ['created_at']

class BackgroundJobSerializer(serializers.ModelSerializer):
    created_by_details = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()
    
    class Meta:
        model = BackgroundJob
        fields = '__all__'
        read_only_fields = ['created_by', 'started_at', 'completed_at', 'created_at']
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'username': obj.created_by.username}
        return None
    
    def get_duration_seconds(self, obj):
        if obj.started_at and obj.completed_at:
            return (obj.completed_at - obj.started_at).total_seconds()
        return None

class AutomationTemplateSerializer(serializers.ModelSerializer):
    created_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = AutomationTemplate
        fields = '__all__'
        read_only_fields = ['created_by', 'usage_count', 'created_at']
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'username': obj.created_by.username}
        return None
