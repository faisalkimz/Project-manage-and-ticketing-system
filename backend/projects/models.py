from django.db import models
from django.conf import settings
from django.utils import timezone

class Project(models.Model):
    class Status(models.TextChoices):
        PLANNING = 'PLANNING', 'Planning'
        ACTIVE = 'ACTIVE', 'Active'
        ON_HOLD = 'ON_HOLD', 'On Hold'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    name = models.CharField(max_length=255)
    key = models.CharField(max_length=10, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    background_color = models.CharField(max_length=20, default='#0079BF')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_projects')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='projects', blank=True)
    watchers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='watched_projects', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6366F1') # Hex color

    def __str__(self):
        return self.name

class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'

    class Status(models.TextChoices):
        TODO = 'TODO', 'To Do'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        REVIEW = 'REVIEW', 'Review'
        DONE = 'DONE', 'Done'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    due_date = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')
    dependencies = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='dependents')
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
