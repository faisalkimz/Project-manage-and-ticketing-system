from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)  # e.g., "ticket.view_all"
    description = models.TextField(blank=True)
    resource = models.CharField(max_length=50)  # e.g., "ticket"
    action = models.CharField(max_length=50)    # e.g., "view_all"

    def __str__(self):
        return self.name

class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    is_system_role = models.BooleanField(default=False)  # Prevent deletion of core roles

    def __str__(self):
        return self.name

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Role is now a ForeignKey. We make it nullable temporarily for migration, 
    # but in practice every user should have a role.
    class Department(models.TextChoices):
        ENGINEERING = 'CORE_ENGINEERING', 'Core Engineering'
        PRODUCT_DESIGN = 'PRODUCT_DESIGN', 'Product Design'
        CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS', 'Customer Success'
        GENERAL = 'GENERAL', 'General'

    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, related_name='users')
    department = models.CharField(max_length=100, choices=Department.choices, default=Department.GENERAL)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    
    # Notification Preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    task_updates_only = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"

    @property
    def permissions(self):
        if self.role:
            return self.role.permissions.values_list('name', flat=True)
        return []

    def has_permission(self, permission_name):
        return self.role and self.role.permissions.filter(name=permission_name).exists()

class Team(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(User, related_name='teams_membership')
    lead = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='led_teams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TeamInvite(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('EXPIRED', 'Expired'),
        ('REVOKED', 'Revoked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_invites')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Invite for {self.email} - {self.status}"
