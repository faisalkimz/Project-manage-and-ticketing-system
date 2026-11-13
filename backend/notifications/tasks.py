from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from projects.models import Task
from .utils import create_notification
from .models import EmailAlert, ActivityAlert

@shared_task(name='notifications.check_due_date_reminders')
def check_due_date_reminders():
    """
    US-003: Due Date Reminder
    Scans active tasks (TODO or IN_PROGRESS) due in the next 24 hours
    and delivers reminder notifications and emails to task owners.
    """
    now = timezone.now()
    reminder_window_end = now + timedelta(hours=24)

    tasks_due_soon = Task.objects.filter(
        due_date__gte=now,
        due_date__lte=reminder_window_end,
        status__in=['TODO', 'IN_PROGRESS'],
        assigned_to__isnull=False
    ).select_related('assigned_to', 'project')

    reminders_sent = 0
    for task in tasks_due_soon:
        # Check if reminder was already sent in the last 20 hours to prevent duplicate spam
        existing_alert = ActivityAlert.objects.filter(
            user=task.assigned_to,
            object_id=task.id,
            activity_type='PROJECT_UPDATE',
            created_at__gte=now - timedelta(hours=20)
        ).exists()

        if not existing_alert:
            create_notification(
                recipient=task.assigned_to,
                event='DUE_DATE_APPROACHING',
                title=f"Task Due in 24 Hours: {task.title}",
                body=f"Your task '{task.title}' in project '{task.project.name}' is due on {task.due_date.strftime('%b %d, %Y at %H:%M')}. Please review and update its progress.",
                related_object=task
            )
            reminders_sent += 1

    return f"Processed {tasks_due_soon.count()} tasks due soon. Sent {reminders_sent} reminders."
