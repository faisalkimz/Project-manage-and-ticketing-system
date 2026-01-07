from django.db import models
from django.conf import settings
from projects.models import Task, Tag
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericRelation
from activity.models import Comment, Attachment, AuditLog
import datetime
import random

class TicketQueue(models.Model):
    """Ticket queues for organization"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    
    # Auto-assignment settings
    auto_assign = models.BooleanField(default=False)
    assigned_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='ticket_queues', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class TicketCategory(models.Model):
    """Categories for tickets"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    
    # SLA defaults for this category
    default_sla_hours = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Ticket Categories"

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
    
    # Escalation settings
    escalate_on_breach = models.BooleanField(default=True)
    escalation_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='escalated_sla_policies', blank=True)
    
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
    
    # Extended categorization
    ticket_category = models.ForeignKey(TicketCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    queue = models.ForeignKey(TicketQueue, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_tickets')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_tickets')
    
    project_task = models.OneToOneField(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='source_ticket')
    tags = models.ManyToManyField(Tag, blank=True, related_name='tickets')
    
    comments = GenericRelation(Comment)
    attachments = GenericRelation(Attachment)
    audit_logs = GenericRelation(AuditLog)
    
    # SLA Fields
    sla_policy = models.ForeignKey(SLAPolicy, on_delete=models.SET_NULL, null=True, blank=True)
    sla_due_date = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    sla_breached = models.BooleanField(default=False)
    
    # Escalation
    escalated = models.BooleanField(default=False)
    escalated_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_tickets')
    escalated_at = models.DateTimeField(null=True, blank=True)
    escalation_reason = models.TextField(blank=True)
    
    # Customer vs Internal
    is_internal = models.BooleanField(default=False, help_text="Internal ticket not visible to customers")
    
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
        
        # Check SLA breach
        if self.sla_due_date and timezone.now() > self.sla_due_date and not self.resolved_at:
            if not self.sla_breached:
                self.sla_breached = True
                self.trigger_escalation()
            
        super().save(*args, **kwargs)

    def calculate_sla(self):
        policy = None
        
        # Try to get SLA from category or priority
        if self.ticket_category and self.ticket_category.default_sla_hours:
            hours = self.ticket_category.default_sla_hours
        else:
            try:
                policy = SLAPolicy.objects.get(priority=self.priority)
                hours = policy.resolution_time_hours
                self.sla_policy = policy
            except SLAPolicy.DoesNotExist:
                # Default fallbacks
                hours = {
                    'CRITICAL': 4,
                    'HIGH': 24,
                    'MEDIUM': 48,
                    'LOW': 72
                }.get(self.priority, 48)
        
        self.sla_due_date = timezone.now() + datetime.timedelta(hours=hours)
    
    def trigger_escalation(self):
        """Trigger escalation when SLA is breached"""
        if self.sla_policy and self.sla_policy.escalate_on_breach:
            self.escalated = True
            self.escalated_at = timezone.now()
            self.escalation_reason = "SLA breach - automatic escalation"
            
            # Assign to escalation users if available
            escalation_users = self.sla_policy.escalation_users.first()
            if escalation_users:
                self.escalated_to = escalation_users

    def __str__(self):
        return f"{self.ticket_number}: {self.title}"

class TicketNote(models.Model):
    """Internal notes on tickets - not visible to customers"""
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='internal_notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note on {self.ticket.ticket_number} by {self.author.username if self.author else 'Unknown'}"

