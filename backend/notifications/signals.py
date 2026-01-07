from django.db.models.signals import post_save
from django.dispatch import receiver
from projects.models import Task
from tickets.models import Ticket
from activity.models import Comment
from .utils import create_notification

@receiver(post_save, sender=Task)
def task_notification(sender, instance, created, **kwargs):
    if created and instance.assigned_to:
        create_notification(
            recipient=instance.assigned_to,
            event='TASK_ASSIGNED',
            title=f"New Task Assigned: {instance.title}",
            body=f"You have been assigned to task {instance.title} in project {instance.project.name}",
            related_object=instance
        )
    elif not created and instance.assigned_to:
        # Check if status changed (simple check not tracking old, assuming any save might be update)
        # Ideally we track pre_save state or use instance._loaded_values if available, 
        # For MVP we notify on update if assigned
        create_notification(
            recipient=instance.assigned_to,
            event='TASK_UPDATED',
            title=f"Task Updated: {instance.title}",
            body=f"The task {instance.title} has been updated. Current status: {instance.status}",
            related_object=instance
        )

@receiver(post_save, sender=Ticket)
def ticket_notification(sender, instance, created, **kwargs):
    if created and instance.assigned_to:
        create_notification(
            recipient=instance.assigned_to,
            event='TICKET_ASSIGNED',
            title=f"New Ticket Assigned: {instance.ticket_number}",
            body=f"You have been assigned to ticket {instance.title}",
            related_object=instance
        )
    elif instance.status in ['RESOLVED', 'CLOSED'] and instance.submitted_by:
        create_notification(
            recipient=instance.submitted_by,
            event='TICKET_RESOLVED' if instance.status == 'RESOLVED' else 'TICKET_CLOSED',
            title=f"Ticket {instance.status.title()}: {instance.ticket_number}",
            body=f"Your ticket {instance.title} has been {instance.status.lower()}.",
            related_object=instance
        )

@receiver(post_save, sender=Comment)
def comment_notification(sender, instance, created, **kwargs):
    if created:
        # Simplistic logic: notify owner of related object
        # In a real app, logic would be complex (all followers, etc.)
        related_obj = instance.content_object
        recipient = None
        
        if hasattr(related_obj, 'assigned_to') and related_obj.assigned_to and related_obj.assigned_to != instance.user:
            recipient = related_obj.assigned_to
        elif hasattr(related_obj, 'submitted_by') and related_obj.submitted_by != instance.user:
            recipient = related_obj.submitted_by
            
        if recipient:
            create_notification(
                recipient=recipient,
                event='COMMENT_ADDED',
                title="New Comment",
                body=f"{instance.user.username} commented: {instance.content[:50]}...",
                related_object=related_obj
            )
