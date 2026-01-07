from django.db import models
from django.conf import settings
from projects.models import Task, Project

class TimeEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_entries')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries', null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='time_entries', null=True, blank=True)
    
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0, help_text="Duration in minutes")
    
    description = models.TextField(blank=True)
    is_running = models.BooleanField(default=False)
    is_billable = models.BooleanField(default=True)
    is_manual = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-calculate duration if end_time is set
        if self.start_time and self.end_time and not self.is_running:
            delta = self.end_time - self.start_time
            self.duration_minutes = int(delta.total_seconds() / 60)
        
        # Ensure project is set if task is set
        if self.task and not self.project:
            self.project = self.task.project
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.task.title if self.task else 'Misc'} ({self.duration_minutes}m)"

class ResourceHoliday(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='holidays')
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class WorkSchedule(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='work_schedule')
    daily_capacity_hours = models.DecimalField(max_digits=4, decimal_places=1, default=8.0)
    work_days = models.CharField(max_length=50, default='1,2,3,4,5', help_text="Comma separated day indices (0=Mon, 6=Sun)")

    def __str__(self):
        return f"{self.user.username} Schedule"
