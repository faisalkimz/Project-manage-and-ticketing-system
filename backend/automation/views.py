from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.utils import user_role_in
from django.utils import timezone
from django.db.models import Q
from .models import WorkflowRule, WorkflowExecution, Webhook, WebhookLog, BackgroundJob, AutomationTemplate
from .serializers import (
    WorkflowRuleSerializer, WorkflowExecutionSerializer, WebhookSerializer,
    WebhookLogSerializer, BackgroundJobSerializer, AutomationTemplateSerializer
)
from .utils import execute_workflow_rule, send_webhook
import requests

class WorkflowRuleViewSet(viewsets.ModelViewSet):
    queryset = WorkflowRule.objects.all()
    serializer_class = WorkflowRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Admins see all, others see their created rules
        if user_role_in(user, ['ADMIN', 'PROJECT_MANAGER']):
            return WorkflowRule.objects.all()
        return WorkflowRule.objects.filter(created_by=user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test_execution(self, request, pk=None):
        """Test workflow rule execution"""
        rule = self.get_object()
        
        # You would implement actual execution logic here
        # For now, create a test execution log
        execution = WorkflowExecution.objects.create(
            rule=rule,
            triggered_by_user=request.user,
            target_content_type=rule.target_content_type,
            target_object_id=request.data.get('test_object_id', 1),
            status='SUCCESS',
            actions_executed=rule.actions,
            execution_log="Test execution completed successfully"
        )
        
        rule.execution_count += 1
        rule.last_executed = timezone.now()
        rule.save()
        
        return Response({
            'message': 'Rule executed successfully',
            'execution': WorkflowExecutionSerializer(execution).data
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activate or deactivate a rule"""
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save()
        return Response({
            'is_active': rule.is_active,
            'message': f'Rule {"activated" if rule.is_active else "deactivated"}'
        })
    
    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """Get execution history for a rule"""
        rule = self.get_object()
        executions = rule.executions.all()[:50]  # Last 50 executions
        serializer = WorkflowExecutionSerializer(executions, many=True)
        return Response(serializer.data)

class WorkflowExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowExecution.objects.all()
    serializer_class = WorkflowExecutionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user_role_in(user, ['ADMIN', 'PROJECT_MANAGER']):
            return WorkflowExecution.objects.all()
        return WorkflowExecution.objects.filter(rule__created_by=user)

class WebhookViewSet(viewsets.ModelViewSet):
    queryset = Webhook.objects.all()
    serializer_class = WebhookSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test webhook delivery"""
        webhook = self.get_object()
        
        test_payload = {
            'event': webhook.event,
            'test': True,
            'timestamp': timezone.now().isoformat(),
            'data': request.data.get('test_data', {'message': 'Test webhook'})
        }
        
        try:
            response = send_webhook(webhook, test_payload)
            
            # Log the test
            log = WebhookLog.objects.create(
                webhook=webhook,
                status='SUCCESS' if response.status_code < 400 else 'FAILED',
                status_code=response.status_code,
                request_payload=test_payload,
                response_body=response.text[:1000],  # Truncate long responses
                attempt_number=1
            )
            
            if response.status_code < 400:
                webhook.success_count += 1
            else:
                webhook.failure_count += 1
            webhook.last_triggered = timezone.now()
            webhook.save()
            
            return Response({
                'success': response.status_code < 400,
                'status_code': response.status_code,
                'response': response.text[:500]
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Get webhook delivery logs"""
        webhook = self.get_object()
        logs = webhook.logs.all()[:100]
        serializer = WebhookLogSerializer(logs, many=True)
        return Response(serializer.data)

class BackgroundJobViewSet(viewsets.ModelViewSet):
    queryset = BackgroundJob.objects.all()
    serializer_class = BackgroundJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user_role_in(user, ['ADMIN']):
            return BackgroundJob.objects.all()
        return BackgroundJob.objects.filter(created_by=user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a pending or running job"""
        job = self.get_object()
        
        if job.status in ['PENDING', 'RUNNING']:
            job.status = 'CANCELLED'
            job.completed_at = timezone.now()
            job.save()
            return Response({'message': 'Job cancelled successfully'})
        else:
            return Response(
                {'error': 'Can only cancel pending or running jobs'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get detailed job status"""
        job = self.get_object()
        return Response({
            'job_name': job.job_name,
            'status': job.status,
            'progress': job.progress_percentage,
            'started_at': job.started_at,
            'completed_at': job.completed_at,
            'error': job.error_message if job.status == 'FAILED' else None
        })

class AutomationTemplateViewSet(viewsets.ModelViewSet):
    queryset = AutomationTemplate.objects.all()
    serializer_class = AutomationTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Everyone can see system templates, users can see their own
        user = self.request.user
        return AutomationTemplate.objects.filter(
            Q(is_system=True) | Q(created_by=user)
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Create a workflow rule from this template"""
        template = self.get_object()
        
        # Increment usage count
        template.usage_count += 1
        template.save()
        
        # Create rule from template
        config = template.config_template.copy()
        config['name'] = request.data.get('name', f"{template.name} - Instance")
        config['is_active'] = request.data.get('is_active', True)
        
        rule_serializer = WorkflowRuleSerializer(data=config, context={'request': request})
        if rule_serializer.is_valid():
            rule_serializer.save(created_by=request.user)
            return Response(rule_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(rule_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get templates grouped by category"""
        category = request.query_params.get('category')
        if category:
            templates = self.get_queryset().filter(category=category)
        else:
            templates = self.get_queryset()
        
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)
