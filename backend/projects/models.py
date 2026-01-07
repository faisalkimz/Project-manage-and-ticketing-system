from django.db import models
from django.conf import settings
from django.utils import timezone

class ProjectCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#6366F1')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Project Categories"

class Portfolio(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='portfolios')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Program(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='programs', null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='programs')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Project(models.Model):
    class Status(models.TextChoices):
        PLANNING = 'PLANNING', 'Planning'
        ACTIVE = 'ACTIVE', 'Active'
        ON_HOLD = 'ON_HOLD', 'On Hold'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class Visibility(models.TextChoices):
        PRIVATE = 'PRIVATE', 'Private'
        PUBLIC = 'PUBLIC', 'Public'
        TEAM_ONLY = 'TEAM_ONLY', 'Team Only'

    class Health(models.TextChoices):
        HEALTHY = 'HEALTHY', 'Healthy'
        AT_RISK = 'AT_RISK', 'At Risk'
        OFF_TRACK = 'OFF_TRACK', 'Off Track'

    name = models.CharField(max_length=255)
    key = models.CharField(max_length=10, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(default=timezone.now) # Django handles datetime -> date conversion
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    visibility = models.CharField(max_length=20, choices=Visibility.choices, default=Visibility.TEAM_ONLY)
    health_status = models.CharField(max_length=20, choices=Health.choices, default=Health.HEALTHY)
    
    background_color = models.CharField(max_length=20, default='#0079BF')
    is_template = models.BooleanField(default=False)
    
    # Ownership & Hierarchies
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_projects')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='projects', blank=True)
    watchers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='watched_projects', blank=True)
    team = models.ForeignKey('users.Team', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    
    parent_project = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subprojects')
    category = models.ForeignKey(ProjectCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    
    dependencies = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='dependent_projects')
    starred_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='starred_projects', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProjectGoal(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_date = models.DateField(null=True, blank=True)
    is_achieved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.project.name} - {self.title}"

class Tag(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6366F1') # Hex color

    def __str__(self):
        return self.name

class Milestone(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class Deliverable(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deliverables')
    milestone = models.ForeignKey(Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliverables')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class ProjectStatus(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='custom_statuses')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='#DFE1E6')
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        unique_together = ['project', 'name']

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class Sprint(models.Model):
    class Status(models.TextChoices):
        PLANNED = 'PLANNED', 'Planned'
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    name = models.CharField(max_length=100)
    goal = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.name}"

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

    class IssueType(models.TextChoices):
        EPIC = 'EPIC', 'Epic'
        STORY = 'STORY', 'User Story'
        TASK = 'TASK', 'Task'
        BUG = 'BUG', 'Bug'
        FEATURE = 'FEATURE', 'Feature Request'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    issue_type = models.CharField(max_length=20, choices=IssueType.choices, default=IssueType.TASK)
    story_points = models.IntegerField(default=0, blank=True)
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    watchers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='watched_tasks', blank=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')
    dependencies = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='dependents')
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    milestone = models.ForeignKey(Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    is_archived = models.BooleanField(default=False)
    
    # Recurrence fields
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=100, blank=True, null=True) # e.g., 'DAILY', 'WEEKLY', 'MONTHLY'
    next_recurrence = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
class Release(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='releases')
    name = models.CharField(max_length=100)
    version = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    release_date = models.DateField()
    is_released = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class SprintRetrospective(models.Model):
    sprint = models.OneToOneField(Sprint, on_delete=models.CASCADE, related_name='retrospective')
    went_well = models.TextField(help_text="What went well during the sprint?")
    could_be_improved = models.TextField(help_text="What could be improved?")
    action_items = models.TextField(help_text="Actions for the next sprint.")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Retrospective for {self.sprint.name}"

class SprintCapacity(models.Model):
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='capacities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    hours_per_day = models.DecimalField(max_digits=4, decimal_places=1, default=8.0)
    days_off = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['sprint', 'user']

    def __str__(self):
        return f"{self.user.username} - {self.sprint.name} Capacity"

class TaskHistory(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=20)
    story_points = models.IntegerField(null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.task.title} changed at {self.changed_at}"
