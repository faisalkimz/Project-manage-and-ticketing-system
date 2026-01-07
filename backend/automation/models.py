from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

class WorkflowRule(models.Model):
    """Custom automation rules"""
    class TriggerType(models.TextChoices):
        STATUS_CHANGE = 'STATUS_CHANGE', 'Status Changed'
        ASSIGNMENT = 'ASSIGNMENT', 'Item Assigned'
        DUE_DATE_APPROACHING = 'DUE_DATE_APPROACHING', 'Due Date Approaching'
        CREATED = 'CREATED', 'Item Created'
        UPDATED = 'UPDATED', 'Item Updated'
        COMMENT_ADDED = 'COMMENT_ADDED', 'Comment Added'
        SCHEDULED = 'SCHEDULED', 'Scheduled Time'
        WEBHOOK = 'WEBHOOK', 'Webhook Triggered'
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # What object type this rule applies to
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    
    # Trigger definition
    trigger_type = models.CharField(max_length=30, choices=TriggerType.choices)
    trigger_conditions = models.JSONField(default=dict, help_text="JSON conditions for trigger")
    
    # Actions to perform
    actions = models.JSONField(default=list, help_text="List of actions to execute")
    
    # Scheduling
    is_scheduled = models.BooleanField(default=False)
    schedule_cron = models.CharField(max_length=100, blank=True, help_text="Cron expression for scheduling")
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Execution stats
    execution_count = models.IntegerField(default=0)
    last_executed = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class WorkflowExecution(models.Model):
    """Log of workflow executions"""
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        PARTIAL = 'PARTIAL', 'Partial Success'
    
    rule = models.ForeignKey(WorkflowRule, on_delete=models.CASCADE, related_name='executions')
    
    # What triggered this execution
    triggered_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Target object
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    target_object_id = models.PositiveIntegerField()
    target_object = GenericForeignKey('target_content_type', 'target_object_id')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    executed_at = models.DateTimeField(auto_now_add=True)
    
    # Execution details
    actions_executed = models.JSONField(default=list)
    execution_log = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-executed_at']
    
    def __str__(self):
        return f"{self.rule.name} - {self.executed_at}"

class Webhook(models.Model):
    """Webhook integrations"""
    class Event(models.TextChoices):
        TASK_CREATED = 'TASK_CREATED', 'Task Created'
        TASK_UPDATED = 'TASK_UPDATED', 'Task Updated'
        TASK_COMPLETED = 'TASK_COMPLETED', 'Task Completed'
        PROJECT_CREATED = 'PROJECT_CREATED', 'Project Created'
        TICKET_CREATED = 'TICKET_CREATED', 'Ticket Created'
        TICKET_RESOLVED = 'TICKET_RESOLVED', 'Ticket Resolved'
        SPRINT_STARTED = 'SPRINT_STARTED', 'Sprint Started'
        SPRINT_COMPLETED = 'SPRINT_COMPLETED', 'Sprint Completed'
    
    name = models.CharField(max_length=255)
    url = models.URLField()
    event = models.CharField(max_length=30, choices=Event.choices)
    is_active = models.BooleanField(default=True)
    
    # Headers and authentication
    headers = models.JSONField(default=dict, help_text="Custom headers as JSON")
    secret_token = models.CharField(max_length=255, blank=True, help_text="Secret for webhook verification")
    
    # Retry configuration
    max_retries = models.IntegerField(default=3)
    retry_delay_seconds = models.IntegerField(default=60)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Stats
    success_count = models.IntegerField(default=0)
    failure_count = models.IntegerField(default=0)
    last_triggered = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} - {self.event}"

class WebhookLog(models.Model):
    """Log of webhook deliveries"""
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        RETRY = 'RETRY', 'Retry Scheduled'
    
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name='logs')
    
    status = models.CharField(max_length=20, choices=Status.choices)
    status_code = models.IntegerField(null=True, blank=True)
    
    request_payload = models.JSONField()
    response_body = models.TextField(blank=True)
    
    attempt_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.webhook.name} - {self.status} - {self.created_at}"

class BackgroundJob(models.Model):
    """Background job queue"""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        RUNNING = 'RUNNING', 'Running'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    class JobType(models.TextChoices):
        REPORT_GENERATION = 'REPORT_GENERATION', 'Report Generation'
        DATA_EXPORT = 'DATA_EXPORT', 'Data Export'
        BULK_UPDATE = 'BULK_UPDATE', 'Bulk Update'
        EMAIL_BATCH = 'EMAIL_BATCH', 'Email Batch'
        SYNC_OPERATION = 'SYNC_OPERATION', 'Sync Operation'
        CLEANUP = 'CLEANUP', 'Cleanup Task'
    
    job_type = models.CharField(max_length=30, choices=JobType.choices)
    job_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Job parameters
    parameters = models.JSONField(default=dict)
    result = models.JSONField(default=dict, blank=True)
    
    # Execution details
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_percentage = models.IntegerField(default=0)
    
    error_message = models.TextField(blank=True)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.job_name} - {self.status}"

class AutomationTemplate(models.Model):
    """Pre-built automation templates"""
    class Category(models.TextChoices):
        STATUS = 'STATUS', 'Status Automation'
        ASSIGNMENT = 'ASSIGNMENT', 'Assignment Automation'
        NOTIFICATION = 'NOTIFICATION', 'Notification Automation'
        SLA = 'SLA', 'SLA Automation'
        WORKFLOW = 'WORKFLOW', 'Workflow Automation'
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=Category.choices)
    
    # Template configuration
    config_template = models.JSONField(help_text="JSON template for automation config")
    
    is_system = models.BooleanField(default=False, help_text="System-provided template")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    usage_count = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name
