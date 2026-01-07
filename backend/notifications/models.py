from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

class NotificationRule(models.Model):
    """Custom notification rules for users"""
    class TriggerEvent(models.TextChoices):
        TASK_ASSIGNED = 'TASK_ASSIGNED', 'Task Assigned to Me'
        TASK_UPDATED = 'TASK_UPDATED', 'Task Updated'
        TASK_COMPLETED = 'TASK_COMPLETED', 'Task Completed'
        TICKET_ASSIGNED = 'TICKET_ASSIGNED', 'Ticket Assigned to Me'
        COMMENT_ADDED = 'COMMENT_ADDED', 'Comment Added'
        MENTIONED = 'MENTIONED', 'Mentioned in Comment'
        DUE_DATE_APPROACHING = 'DUE_DATE_APPROACHING', 'Due Date Approaching'
        SLA_BREACH = 'SLA_BREACH', 'SLA Breach'
        PROJECT_UPDATED = 'PROJECT_UPDATED', 'Project Updated'
    
    class NotifyVia(models.TextChoices):
        IN_APP = 'IN_APP', 'In-App Notification'
        EMAIL = 'EMAIL', 'Email'
        PUSH = 'PUSH', 'Push Notification'
        ALL = 'ALL', 'All Channels'
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_rules')
    event = models.CharField(max_length=30, choices=TriggerEvent.choices)
    notify_via = models.CharField(max_length=20, choices=NotifyVia.choices, default=NotifyVia.IN_APP)
    is_active = models.BooleanField(default=True)
    
    # Additional filters
    only_priority = models.CharField(max_length=20, blank=True, help_text="Only notify for specific priority")
    only_projects = models.ManyToManyField('projects.Project', blank=True, help_text="Only notify for specific projects")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'event', 'notify_via']
    
    def __str__(self):
        return f"{self.user.username} - {self.event} via {self.notify_via}"

class EmailAlert(models.Model):
    """Email alerts sent to users"""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
    
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_alerts')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    html_body = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    # Related object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Email to {self.recipient.username}: {self.subject}"

class PushNotification(models.Model):
    """Push notifications for mobile/web"""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
    
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_push_notifications')
    title = models.CharField(max_length=255)
    body = models.TextField()
    
    # Push notification metadata
    data = models.JSONField(default=dict, help_text="Additional data for the notification")
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Device tokens (if using FCM/APNS)
    device_tokens = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Push to {self.recipient.username}: {self.title}"

class ReminderNotification(models.Model):
    """Scheduled reminder notifications"""
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        SENT = 'SENT', 'Sent'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reminders')
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    scheduled_for = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Related object (task, ticket, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    # Notification channels
    notify_email = models.BooleanField(default=False)
    notify_push = models.BooleanField(default=True)
    notify_in_app = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['scheduled_for']
    
    def __str__(self):
        return f"Reminder for {self.user.username}: {self.title}"

class DeadlineAlert(models.Model):
    """Alerts for approaching deadlines"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # What has a deadline
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    deadline_object = GenericForeignKey('content_type', 'object_id')
    
    deadline = models.DateTimeField()
    alert_before_hours = models.IntegerField(default=24, help_text="Alert X hours before deadline")
    
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['deadline']
    
    def __str__(self):
        return f"Deadline alert for {self.user.username}"

class SLABreachAlert(models.Model):
    """Alerts for SLA breaches"""
    class Status(models.TextChoices):
        WARNING = 'WARNING', 'Warning (80% time elapsed)'
        IMMINENT = 'IMMINENT', 'Imminent (95% time elapsed)'
        BREACHED = 'BREACHED', 'Breached'
    
    ticket = models.ForeignKey('tickets.Ticket', on_delete=models.CASCADE, related_name='sla_alerts')
    alert_level = models.CharField(max_length=20, choices=Status.choices)
    
    notified_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='sla_breach_alerts')
    
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"SLA {self.alert_level} for {self.ticket.ticket_number}"

class ActivityAlert(models.Model):
    """Real-time activity alerts"""
    class ActivityType(models.TextChoices):
        COMMENT = 'COMMENT', 'New Comment'
        STATUS_CHANGE = 'STATUS_CHANGE', 'Status Changed'
        ASSIGNMENT = 'ASSIGNMENT', 'Assignment Changed'
        MENTION = 'MENTION', 'You were mentioned'
        FILE_UPLOAD = 'FILE_UPLOAD', 'File Uploaded'
        PROJECT_UPDATE = 'PROJECT_UPDATE', 'Project Updated'
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_alerts')
    activity_type = models.CharField(max_length=30, choices=ActivityType.choices)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.activity_type} for {self.user.username}"

class UserDeviceToken(models.Model):
    """Store user device tokens for push notifications"""
    class Platform(models.TextChoices):
        WEB = 'WEB', 'Web'
        ANDROID = 'ANDROID', 'Android'
        IOS = 'IOS', 'iOS'
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='device_tokens')
    token = models.CharField(max_length=500, unique=True)
    platform = models.CharField(max_length=20, choices=Platform.choices)
    
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(auto_now=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.platform}"
