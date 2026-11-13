from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Task, Project
from collaboration.utils import create_notification
from automation.utils import evaluate_rules_for_object


@receiver(post_save, sender=Task)
def task_post_save(sender, instance, created, **kwargs):
    # 1. Collaboration Notifications
    if created:
        if instance.assigned_to:
            create_notification(
                user=instance.assigned_to,
                actor=instance.created_by,
                verb='assigned you to',
                target=instance,
                description=f'Task: {instance.title}'
            )
    else:
        # If updated and assignee exists
        if instance.assigned_to:
            create_notification(
                user=instance.assigned_to,
                actor=instance.created_by,
                verb='updated task assigned to you',
                target=instance,
                description=f'Task: {instance.title}'
            )

    # 2. Automation Workflow Rule Evaluation
    trigger_type = 'CREATED' if created else 'UPDATED'
    try:
        evaluate_rules_for_object(instance, trigger_type=trigger_type)
        if instance.status == 'DONE':
            evaluate_rules_for_object(instance, trigger_type='STATUS_CHANGED')
    except Exception as e:
        print(f"Workflow automation error on task save: {e}")

    # 3. Ticket->Task Pipeline Auto-Resolve (US-015)
    # When task moves to DONE, linked source ticket is automatically moved to RESOLVED
    if instance.status == 'DONE':
        try:
            if hasattr(instance, 'source_ticket') and instance.source_ticket:
                ticket = instance.source_ticket
                if ticket.status not in ['RESOLVED', 'CLOSED']:
                    ticket.status = 'RESOLVED'
                    ticket.save(update_fields=['status'])
        except Exception as e:
            print(f"Error auto-resolving source ticket for task {instance.id}: {e}")


@receiver(pre_save, sender=Task)
def task_pre_save(sender, instance, **kwargs):
    if instance.id:
        try:
            old_instance = Task.objects.get(id=instance.id)
            if old_instance.status != instance.status:
                instance._status_changed = True
        except Task.DoesNotExist:
            pass
