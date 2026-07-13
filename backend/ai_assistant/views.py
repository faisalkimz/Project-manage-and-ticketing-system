from rest_framework import viewsets, permissions
from .models import AIPromptTemplate, AIRequestLog
from .serializers import AIPromptTemplateSerializer, AIRequestLogSerializer

class AIPromptTemplateViewSet(viewsets.ModelViewSet):
    queryset = AIPromptTemplate.objects.all()
    serializer_class = AIPromptTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

class AIRequestLogViewSet(viewsets.ModelViewSet):
    queryset = AIRequestLog.objects.all()
    serializer_class = AIRequestLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
