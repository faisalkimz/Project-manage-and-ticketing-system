from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Data Export'),
        ('VIEW', 'View Sensitive Data'),
        ('APPROVAL', 'Approval Action'),
    ]

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    # Generic relation to any object in the system
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    object_id = models.CharField(max_length=255) # CharField to support UUIDs if needed
    target_object = GenericForeignKey('content_type', 'object_id')
    
    changes = models.JSONField(default=dict) # Stores {field: {old: X, new: Y}}
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['action']),
            models.Index(fields=['actor']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor} performed {self.action} on {self.timestamp}"

class ComplianceReport(models.Model):
    title = models.CharField(max_length=255)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)
    scope_start = models.DateTimeField()
    scope_end = models.DateTimeField()
    file_path = models.FileField(upload_to='compliance_reports/')
