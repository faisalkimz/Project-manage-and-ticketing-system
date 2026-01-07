from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Task
from collaboration.utils import create_notification

@receiver(post_save, sender=Task)
def task_notifications(sender, instance, created, **kwargs):
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
        # Check if assignee changed
        # Note: This is a simplified version, ideally you'd check old value via pre_save
        pass

@receiver(pre_save, sender=Task)
def task_pre_save(sender, instance, **kwargs):
    if instance.id:
        old_instance = Task.objects.get(id=instance.id)
        if old_instance.assigned_to != instance.assigned_to and instance.assigned_to:
            # We'll use a flag or just handle it here if we had the request user
            # Since signals don't have request user easily, we usually pass it or omit actor
            pass
