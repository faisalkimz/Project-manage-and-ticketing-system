from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Comment, Attachment, AuditLog
from users.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    content_type_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_details', 'text', 'is_internal', 'content_type', 'content_type_name', 'object_id', 'created_at', 'updated_at']
        read_only_fields = ['user']
    
    def create(self, validated_data):
        content_type_name = validated_data.pop('content_type_name', None)
        if content_type_name:
            content_type = ContentType.objects.get(model=content_type_name)
            validated_data['content_type'] = content_type
        return super().create(validated_data)

class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)
    
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'uploaded_by', 'uploaded_by_details', 'content_type', 'object_id', 'uploaded_at']
        read_only_fields = ['uploaded_by']

class AuditLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_details', 'action', 'content_type', 'object_id', 'details', 'timestamp']
