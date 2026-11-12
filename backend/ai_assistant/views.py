from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .services import AIService
from .models import AIRequestLog, AIPromptTemplate
from rest_framework import serializers

class AIRequestLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRequestLog
        fields = '__all__'

class AIPromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPromptTemplate
        fields = '__all__'

class SummarizeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'text field is required'}, status=status.HTTP_400_BAD_REQUEST)
        max_length = int(request.data.get('max_length', 150))
        summary = AIService.generate_summary(text, user=request.user, max_length=max_length)
        return Response({'summary': summary})

class SuggestTasksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_name = request.data.get('project_name', '')
        current_tasks = request.data.get('current_tasks', [])
        suggestions = AIService.suggest_next_tasks(project_name, current_tasks, user=request.user)
        return Response({'suggestions': suggestions})

class BreakdownTaskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        if not title:
            return Response({'error': 'title field is required'}, status=status.HTTP_400_BAD_REQUEST)
        description = request.data.get('description', '')
        subtasks = AIService.breakdown_task(title, description, user=request.user)
        return Response({'subtasks': subtasks})

class PrioritizeTicketView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        if not title:
            return Response({'error': 'title field is required'}, status=status.HTTP_400_BAD_REQUEST)
        description = request.data.get('description', '')
        customer_tier = request.data.get('customer_tier', 'STANDARD')
        result = AIService.prioritize_ticket(title, description, customer_tier, user=request.user)
        return Response(result)

class AnalyzeRiskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_data = request.data.get('project_data', {})
        result = AIService.analyze_project_risk(project_data, user=request.user)
        return Response(result)

class AIRequestLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIRequestLogSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') in ['ADMIN', 'SUPERADMIN'] or user.is_staff:
            return AIRequestLog.objects.all().order_by('-created_at')
        return AIRequestLog.objects.filter(user=user).order_by('-created_at')

class AIPromptTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIPromptTemplateSerializer
    queryset = AIPromptTemplate.objects.filter(is_active=True)
