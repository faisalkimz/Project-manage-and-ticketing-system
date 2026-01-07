from rest_framework import serializers
from .models import User, Role, Permission, TeamInvite, Team
from projects.models import Project
from django.core.exceptions import ValidationError

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'permissions', 'profile_image', 'bio', 'is_active', 'department', 'job_title', 'email_notifications', 'push_notifications', 'task_updates_only']

    def get_role(self, obj):
        return obj.role.name if obj.role else None

    def get_permissions(self, obj):
        if obj.role:
            return list(obj.role.permissions.values_list('name', flat=True))
        return []

class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'profile_image', 'bio', 'department', 'job_title', 'email_notifications', 'push_notifications', 'task_updates_only']
        read_only_fields = ['username', 'email'] # Maybe keep these safe?

    def update(self, instance, validated_data):
        role_name = validated_data.pop('role', None)
        if role_name:
            try:
                role = Role.objects.get(name=role_name)
                instance.role = role
            except Role.DoesNotExist:
                # Handle invalid role gracefully or error
                pass 
        
        return super().update(instance, validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, default='EMPLOYEE', allow_blank=True)
    token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'token']
        
    def create(self, validated_data):
        token = validated_data.pop('token', None)
        role_name = validated_data.pop('role', 'EMPLOYEE')
        input_email = validated_data['email']
        
        # Default role resolution
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            role = Role.objects.get(name='EMPLOYEE')
            
        # Check for valid invite token
        invite = None
        if token:
            from .models import TeamInvite
            try:
                invite = TeamInvite.objects.get(token=token, status='PENDING')
                if invite.email == input_email:
                    role = invite.role
            except (TeamInvite.DoesNotExist, ValidationError):
                pass
            
        # If this is the first user, make them an ADMIN
        if not User.objects.exists():
            try:
                role = Role.objects.get(name='ADMIN')
            except Role.DoesNotExist:
                pass

        user = User.objects.create_user(
            username=validated_data['username'],
            email=input_email,
            password=validated_data['password'],
            role=role
        )
        
        # Update invite status
        if invite and invite.email == input_email:
            invite.status = 'ACCEPTED'
            invite.save()
            
        return user

class TeamProjectSerializer(serializers.ModelSerializer):
    task_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'background_color', 'task_stats']

    def get_task_stats(self, obj):
        tasks = obj.tasks.all()
        total = tasks.count()
        done = tasks.filter(status='DONE').count()
        percentage = (done / total * 100) if total > 0 else 0
        return {
            'total': total,
            'done': done,
            'percentage': round(percentage, 1)
        }

class TeamSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    lead_name = serializers.CharField(source='lead.username', read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)
    projects_details = TeamProjectSerializer(source='projects', many=True, read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'members', 'lead', 'member_count', 'lead_name', 'members_details', 'projects_details', 'created_at']
        extra_kwargs = {
            'members': {'required': False, 'allow_empty': True},
            'lead': {'read_only': True}
        }

class TeamInviteSerializer(serializers.ModelSerializer):
    invited_by_username = serializers.CharField(source='invited_by.username', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = TeamInvite
        fields = '__all__'
        read_only_fields = ['invited_by', 'token', 'status', 'created_at', 'role']
