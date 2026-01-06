from rest_framework import serializers
from .models import User, Role, Permission, TeamInvite, Team

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'permissions', 'profile_image', 'bio']

    def get_role(self, obj):
        return obj.role.name if obj.role else None

    def get_permissions(self, obj):
        if obj.role:
            return list(obj.role.permissions.values_list('name', flat=True))
        return []

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, default='EMPLOYEE')
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']
        
    def create(self, validated_data):
        role_name = validated_data.pop('role', 'EMPLOYEE')
        
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            role = Role.objects.get(name='EMPLOYEE')
            
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role
        )
        return user

class TeamSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    lead_name = serializers.CharField(source='lead.username', read_only=True)
    members_details = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'members', 'lead', 'member_count', 'lead_name', 'members_details', 'created_at']

class TeamInviteSerializer(serializers.ModelSerializer):
    invited_by_username = serializers.CharField(source='invited_by.username', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = TeamInvite
        fields = '__all__'
        read_only_fields = ['invited_by', 'token', 'status', 'created_at']
