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
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, related_name='users')
    department = models.CharField(max_length=100, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"

    @property
    def permissions(self):
        if self.role:
            return self.role.permissions.values_list('name', flat=True)
        return []

    def has_permission(self, permission_name):
        return self.role and self.role.permissions.filter(name=permission_name).exists()
