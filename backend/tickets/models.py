from django.db import models
from django.conf import settings
from projects.models import Task, Tag
from django.utils import timezone
import datetime
import random

class SLAPolicy(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=[
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical')
    ])
    response_time_hours = models.IntegerField(help_text="Time to first response in hours")
    resolution_time_hours = models.IntegerField(help_text="Time to resolve in hours")
    
    class Meta:
        unique_together = ('priority',)

    def __str__(self):
        return f"{self.priority} SLA ({self.resolution_time_hours}h)"

class Ticket(models.Model):
    class Category(models.TextChoices):
        BUG = 'BUG', 'Bug'
        FEATURE = 'FEATURE', 'Feature'
        IT_SUPPORT = 'IT_SUPPORT', 'IT Support'
        HR = 'HR', 'HR Request'
        FACILITIES = 'FACILITIES', 'Facilities'
        OTHER = 'OTHER', 'Other'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        ON_HOLD = 'ON_HOLD', 'On Hold'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    ticket_number = models.CharField(max_length=50, unique=True, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_tickets')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_tickets')
    
    project_task = models.OneToOneField(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='source_ticket')
    tags = models.ManyToManyField(Tag, blank=True, related_name='tickets')
    
    # SLA Fields
    sla_due_date = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            date_str = datetime.datetime.now().strftime('%Y%m%d')
            rand_suffix = ''.join(random.choices('0123456789', k=4))
            self.ticket_number = f"TKT-{date_str}-{rand_suffix}"
            
        # Calculate SLA if this is a new ticket
        if not self.pk:
            self.calculate_sla()
            
        # Track resolution time
        if self.status in [self.Status.RESOLVED, self.Status.CLOSED] and not self.resolved_at:
            self.resolved_at = timezone.now()
        elif self.status not in [self.Status.RESOLVED, self.Status.CLOSED]:
            self.resolved_at = None
            
        super().save(*args, **kwargs)

    def calculate_sla(self):
        try:
            policy = SLAPolicy.objects.get(priority=self.priority)
            self.sla_due_date = timezone.now() + datetime.timedelta(hours=policy.resolution_time_hours)
        except SLAPolicy.DoesNotExist:
            # Default fallbacks
            hours = {
                'CRITICAL': 4,
                'HIGH': 24,
                'MEDIUM': 48,
                'LOW': 72
            }.get(self.priority, 48)
            self.sla_due_date = timezone.now() + datetime.timedelta(hours=hours)

    def __str__(self):
        return f"{self.ticket_number}: {self.title}"
