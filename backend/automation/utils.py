from django.utils import timezone
from .models import WorkflowExecution, WebhookLog
import requests
import json

def execute_workflow_rule(rule, target_object, triggered_by=None):
    """
    Execute a workflow rule on a target object
    
    Args:
        rule: WorkflowRule instance
        target_object: The object that triggered the rule
        triggered_by: User who triggered the action (optional)
    
    Returns:
        WorkflowExecution instance
    """
    execution_log = []
    actions_executed = []
    status = 'SUCCESS'
    
    try:
        # Evaluate conditions
        if not evaluate_conditions(rule.trigger_conditions, target_object):
            execution_log.append("Conditions not met, skipping execution")
            status = 'PARTIAL'
        else:
            # Execute each action
            for action_config in rule.actions:
                action_type = action_config.get('type')
                action_result = execute_action(action_type, action_config, target_object)
                
                actions_executed.append({
                    'type': action_type,
                    'config': action_config,
                    'result': action_result
                })
                execution_log.append(f"Executed action: {action_type}")
        
        # Update rule stats
        rule.execution_count += 1
        rule.last_executed = timezone.now()
        rule.save()
        
    except Exception as e:
        status = 'FAILED'
        execution_log.append(f"Execution failed: {str(e)}")
    
    # Create execution record
    execution = WorkflowExecution.objects.create(
        rule=rule,
        triggered_by_user=triggered_by,
        target_content_type=rule.target_content_type,
        target_object_id=target_object.id if hasattr(target_object, 'id') else 0,
        status=status,
        actions_executed=actions_executed,
        execution_log='\n'.join(execution_log)
    )
    
    return execution

def evaluate_conditions(conditions, target_object):
    """
    Evaluate if conditions are met
    
    Args:
        conditions: Dict of conditions to evaluate
        target_object: The object to evaluate against
    
    Returns:
        Boolean indicating if conditions are met
    """
    if not conditions:
        return True
    
    # Example condition evaluation
    # You would expand this based on your needs
    for field, expected_value in conditions.items():
        if hasattr(target_object, field):
            actual_value = getattr(target_object, field)
            if actual_value != expected_value:
                return False
    
    return True

def execute_action(action_type, action_config, target_object):
    """
    Execute a specific action
    
    Args:
        action_type: Type of action (e.g., 'assign', 'notify', 'update_status')
        action_config: Configuration for the action
        target_object: The target object
    
    Returns:
        Result of the action execution
    """
    from django.contrib.contenttypes.models import ContentType
    from collaboration.models import Notification
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    if action_type == 'update_status':
        # Update status field
        new_status = action_config.get('status')
        if hasattr(target_object, 'status'):
            target_object.status = new_status
            target_object.save()
            return {'success': True, 'new_status': new_status}
    
    elif action_type == 'assign_to':
        # Assign to a user
        user_id = action_config.get('user_id')
        if user_id and hasattr(target_object, 'assigned_to'):
            try:
                user = User.objects.get(id=user_id)
                target_object.assigned_to = user
                target_object.save()
                return {'success': True, 'assigned_to': user.username}
            except User.DoesNotExist:
                return {'success': False, 'error': 'User not found'}
    
    elif action_type == 'send_notification':
        # Send a notification
        user_ids = action_config.get('user_ids', [])
        message = action_config.get('message', 'You have a new notification')
        verb = action_config.get('verb', 'requires your attention')
        
        content_type = ContentType.objects.get_for_model(target_object)
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                Notification.objects.create(
                    user=user,
                    verb=verb,
                    description=message,
                    content_type=content_type,
                    object_id=target_object.id
                )
            except User.DoesNotExist:
                pass
        
        return {'success': True, 'notifications_sent': len(user_ids)}
    
    elif action_type == 'trigger_webhook':
        # Trigger a webhook
        webhook_id = action_config.get('webhook_id')
        if webhook_id:
            from .models import Webhook
            try:
                webhook = Webhook.objects.get(id=webhook_id)
                payload = {
                    'event': 'workflow_triggered',
                    'object_id': target_object.id if hasattr(target_object, 'id') else None,
                    'timestamp': timezone.now().isoformat()
                }
                send_webhook(webhook, payload)
                return {'success': True, 'webhook_triggered': True}
            except Webhook.DoesNotExist:
                return {'success': False, 'error': 'Webhook not found'}
    
    return {'success': False, 'error': f'Unknown action type: {action_type}'}

def send_webhook(webhook, payload):
    """
    Send a webhook HTTP request
    
    Args:
        webhook: Webhook instance
        payload: Data to send
    
    Returns:
        requests.Response object
    """
    headers = webhook.headers.copy()
    headers['Content-Type'] = 'application/json'
    
    if webhook.secret_token:
        headers['X-Webhook-Secret'] = webhook.secret_token
    
    max_attempts = webhook.max_retries + 1
    
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.post(
                webhook.url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            # Log the delivery
            log_status = 'SUCCESS' if response.status_code < 400 else 'FAILED'
            WebhookLog.objects.create(
                webhook=webhook,
                status=log_status,
                status_code=response.status_code,
                request_payload=payload,
                response_body=response.text[:1000],
                attempt_number=attempt
            )
            
            # Update webhook stats
            if response.status_code < 400:
                webhook.success_count += 1
                webhook.last_triggered = timezone.now()
                webhook.save()
                return response
            else:
                if attempt < max_attempts:
                    # Retry
                    import time
                    time.sleep(webhook.retry_delay_seconds)
                    continue
                else:
                    webhook.failure_count += 1
                    webhook.save()
                    return response
                    
        except Exception as e:
            error_msg = str(e)
            WebhookLog.objects.create(
                webhook=webhook,
                status='FAILED',
                request_payload=payload,
                attempt_number=attempt,
                error_message=error_msg
            )
            
            if attempt < max_attempts:
                import time
                time.sleep(webhook.retry_delay_seconds)
                continue
            else:
                webhook.failure_count += 1
                webhook.save()
                raise
    
    return None
