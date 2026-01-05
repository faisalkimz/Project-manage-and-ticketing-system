from rest_framework import serializers
from .models import User, Role, Permission

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
