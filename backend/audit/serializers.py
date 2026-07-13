from rest_framework import serializers
from .models import AuditLog, ComplianceReport

class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'

class ComplianceReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)

    class Meta:
        model = ComplianceReport
        fields = '__all__'
