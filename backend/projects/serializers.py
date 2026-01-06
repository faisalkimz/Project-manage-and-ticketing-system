from rest_framework import serializers
from .models import Project, Task, Tag
from users.serializers import UserSerializer

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class SubTaskSerializer(serializers.ModelSerializer):
    """ Simplified serializer for subtasks/dependencies to avoid deep recursion overhead """
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'status', 'priority', 'assigned_to_details', 'due_date']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    tags_details = TagSerializer(source='tags', many=True, read_only=True)
    subtasks = SubTaskSerializer(many=True, read_only=True)
    subtasks_count = serializers.IntegerField(source='subtasks.count', read_only=True)
    
    # Dependencies
    dependencies_details = SubTaskSerializer(source='dependencies', many=True, read_only=True)
    dependents_details = SubTaskSerializer(source='dependents', many=True, read_only=True)

    class Meta:
        model = Task
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    # Only show top-level tasks in the project view usually, but for now showing all is fine.
    # We might want to filter tasks in the view instead.
    tasks = TaskSerializer(many=True, read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    
    # Extra field for dashboard
    active_members = serializers.SerializerMethodField()
    task_stats = serializers.SerializerMethodField()
    
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['created_by', 'members']
        
    def get_active_members(self, obj):
        return obj.members.count()
        
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
