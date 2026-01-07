from django.utils import timezone
from .models import NotificationRule, EmailAlert, PushNotification, ActivityAlert
from django.contrib.contenttypes.models import ContentType

def create_notification(recipient, event, title, body, related_object=None, notify_force=None):
    """
    Create a notification for a user based on their preferences
    
    Args:
        recipient: PROJ User model instance
        event: TriggerEvent (e.g. 'TASK_ASSIGNED')
        title: Notification title
        body: Notification body
        related_object: The model instance related to this notification
        notify_force: Optional list of channels to force ['EMAIL', 'PUSH']
    """
    # Check rules
    rule = NotificationRule.objects.filter(user=recipient, event=event).first()
    
    channels = []
    if notify_force:
        channels = notify_force
    elif rule:
        if not rule.is_active:
            return
            
        if rule.notify_via == 'ALL':
            channels = ['IN_APP', 'EMAIL', 'PUSH']
        else:
            channels = [rule.notify_via]
    else:
        # Default behavior if no rule
        channels = ['IN_APP']

    content_type = None
    object_id = None
    if related_object:
        content_type = ContentType.objects.get_for_model(related_object)
        object_id = related_object.id

    # Create notifications for each channel
    if 'IN_APP' in channels:
        ActivityAlert.objects.create(
            user=recipient,
            activity_type=get_activity_type(event),
            title=title,
            message=body,
            content_type=content_type,
            object_id=object_id
        )

    if 'EMAIL' in channels and recipient.email_notifications:
        EmailAlert.objects.create(
            recipient=recipient,
            subject=title,
            body=body,
            content_type=content_type,
            object_id=object_id
        )

    if 'PUSH' in channels and recipient.push_notifications:
        PushNotification.objects.create(
            recipient=recipient,
            title=title,
            body=body,
            data={'object_id': object_id, 'content_type': content_type.model} if content_type else {}
        )

def get_activity_type(event):
    """Map notification event to activity type"""
    mapping = {
        'TASK_ASSIGNED': 'ASSIGNMENT',
        'TASK_UPDATED': 'STATUS_CHANGE',
        'TASK_COMPLETED': 'STATUS_CHANGE',
        'TICKET_ASSIGNED': 'ASSIGNMENT',
        'COMMENT_ADDED': 'COMMENT',
        'MENTIONED': 'MENTION',
        'DUE_DATE_APPROACHING': 'PROJECT_UPDATE',
        'SLA_BREACH': 'PROJECT_UPDATE',
        'PROJECT_UPDATED': 'PROJECT_UPDATE'
    }
    return mapping.get(event, 'PROJECT_UPDATE')
