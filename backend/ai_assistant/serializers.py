from rest_framework import serializers
from .models import AIPromptTemplate, AIRequestLog

class AIPromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPromptTemplate
        fields = '__all__'

class AIRequestLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AIRequestLog
        fields = '__all__'
