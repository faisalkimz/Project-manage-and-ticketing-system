from .models import Notification
from django.contrib.contenttypes.models import ContentType

def create_notification(user, actor, verb, target, description=''):
    """
    Utility to create an in-app notification.
    user: The user who receives the notification
    actor: The user who performed the action
    verb: Description of the action (e.g., 'assigned you to')
    target: The object the action relates to (Task, Project, etc.)
    """
    if user == actor:
        return None # Don't notify yourself
        
    ct = ContentType.objects.get_for_model(target)
    return Notification.objects.create(
        user=user,
        actor=actor,
        verb=verb,
        content_type=ct,
        object_id=target.id,
        description=description
    )
