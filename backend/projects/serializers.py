from rest_framework import serializers
from .models import (
    Project, Task, Tag, Milestone, ProjectCategory, 
    Portfolio, Program, ProjectGoal, Deliverable, ProjectStatus, Sprint
)
from users.serializers import UserSerializer

class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = '__all__'

class PortfolioSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    projects = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = '__all__'
        
    def get_projects(self, obj):
        return [
            {
                "id": p.id, 
                "name": p.name, 
                "key": p.key,
                "status": p.status
            }
            for p in obj.projects.all()
        ]

class ProgramSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    class Meta:
        model = Program
        fields = '__all__'

class ProjectGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectGoal
        fields = '__all__'

class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = '__all__'

class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStatus
        fields = ['id', 'name', 'color', 'order']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class SprintSerializer(serializers.ModelSerializer):
    task_count = serializers.IntegerField(source='tasks.count', read_only=True)
    completed_tasks = serializers.SerializerMethodField()
    
    class Meta:
        model = Sprint
        fields = '__all__'

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='DONE').count()

class MilestoneSerializer(serializers.ModelSerializer):
    task_count = serializers.IntegerField(source='tasks.count', read_only=True)
    completed_tasks = serializers.SerializerMethodField()
    deliverables = DeliverableSerializer(many=True, read_only=True)
    
    class Meta:
        model = Milestone
        fields = '__all__'

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='DONE').count()

class SubTaskSerializer(serializers.ModelSerializer):
    """ Simplified serializer for subtasks/dependencies to avoid deep recursion overhead """
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'status', 'priority', 'assigned_to_details', 'due_date', 'issue_type']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    tags_details = TagSerializer(source='tags', many=True, read_only=True)
    subtasks = SubTaskSerializer(many=True, read_only=True)
    subtasks_count = serializers.IntegerField(source='subtasks.count', read_only=True)
    
    # Dependencies
    dependencies_details = SubTaskSerializer(source='dependencies', many=True, read_only=True)
    dependents_details = SubTaskSerializer(source='dependents', many=True, read_only=True)
    
    watchers_details = UserSerializer(source='watchers', many=True, read_only=True)
    is_watching = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'
        
    def get_is_watching(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.watchers.filter(id=request.user.id).exists()
        return False
        
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.milestone:
            rep['milestone_details'] = MilestoneSerializer(instance.milestone).data
        if instance.sprint:
            rep['sprint_details'] = SprintSerializer(instance.sprint).data
        return rep

class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    sprints = SprintSerializer(many=True, read_only=True)
    goals = ProjectGoalSerializer(many=True, read_only=True)
    deliverables = DeliverableSerializer(many=True, read_only=True)
    custom_statuses = ProjectStatusSerializer(many=True, read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    
    category_details = ProjectCategorySerializer(source='category', read_only=True)
    program_details = ProgramSerializer(source='program', read_only=True)
    portfolio_details = PortfolioSerializer(source='portfolio', read_only=True)
    parent_project_details = serializers.SerializerMethodField()
    child_projects_details = serializers.SerializerMethodField()
    dependencies_details = serializers.SerializerMethodField()
    
    # Extra field for dashboard
    active_members = serializers.SerializerMethodField()
    task_stats = serializers.SerializerMethodField()
    is_watching = serializers.SerializerMethodField()
    is_starred = serializers.SerializerMethodField()
    
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['created_by', 'members', 'watchers', 'starred_by']
        
    def get_parent_project_details(self, obj):
        if obj.parent_project:
            return {
                "id": obj.parent_project.id,
                "name": obj.parent_project.name,
                "key": obj.parent_project.key
            }
        return None

    def get_child_projects_details(self, obj):
        return [
            {"id": p.id, "name": p.name, "key": p.key}
            for p in obj.subprojects.all()
        ]

    def get_dependencies_details(self, obj):
        return [
            {"id": p.id, "name": p.name, "key": p.key}
            for p in obj.dependencies.all()
        ]

    def get_active_members(self, obj):
        return obj.members.count()

    def get_is_watching(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.watchers.filter(id=request.user.id).exists()
        return False

    def get_is_starred(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.starred_by.filter(id=request.user.id).exists()
        return False
        
    def get_task_stats(self, obj):
        tasks = obj.tasks.all()
        total = tasks.count()
        done = tasks.filter(status='DONE').count()
        percentage = (done / total * 100) if total > 0 else 0
        return {
            'total': total,
            'done': done,
            'percentage': round(percentage, 1),
            'todo': tasks.filter(status='TODO').count(),
            'in_progress': tasks.filter(status='IN_PROGRESS').count(),
        }

    def to_internal_value(self, data):
        # Clean empty strings for dates
        new_data = data.copy()
        if new_data.get('start_date') == '':
            new_data.pop('start_date')
        if new_data.get('end_date') == '':
            new_data.pop('end_date')
        return super().to_internal_value(new_data)
