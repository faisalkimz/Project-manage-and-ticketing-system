import logging
from celery import shared_task
from django.utils import timezone
from .models import WorkflowRule, Webhook, WebhookLog, BackgroundJob
from .utils import execute_workflow_rule, send_webhook

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def async_execute_workflow(self, rule_id, content_type_id, object_id, user_id=None):
    """
    Asynchronously executes a workflow rule in Celery worker.
    """
    from django.contrib.contenttypes.models import ContentType
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        rule = WorkflowRule.objects.get(id=rule_id)
        content_type = ContentType.objects.get(id=content_type_id)
        target_object = content_type.get_object_for_this_type(id=object_id)
        user = User.objects.filter(id=user_id).first() if user_id else None

        execution = execute_workflow_rule(rule, target_object, triggered_by=user)
        return {
            'execution_id': execution.id,
            'status': execution.status
        }
    except Exception as exc:
        logger.error(f"Error in async_execute_workflow: {exc}")
        raise self.retry(exc=exc, countdown=60)

@shared_task(bind=True, max_retries=3)
def async_send_webhook(self, webhook_id, payload):
    """
    Asynchronously dispatches outbound webhooks to third-party endpoints.
    """
    try:
        webhook = Webhook.objects.get(id=webhook_id)
        response = send_webhook(webhook, payload)
        
        status = 'SUCCESS' if response.status_code < 400 else 'FAILED'
        WebhookLog.objects.create(
            webhook=webhook,
            status=status,
            status_code=response.status_code,
            request_payload=payload,
            response_body=response.text[:1000],
            attempt_number=self.request.retries + 1
        )
        if response.status_code >= 400:
            raise self.retry(countdown=30)
        return {'status_code': response.status_code}
    except Exception as exc:
        logger.error(f"Error dispatching webhook: {exc}")
        raise self.retry(exc=exc, countdown=30)

