from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Comment, Attachment, AuditLog
from users.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_details', 'text', 'content_type', 'object_id', 'created_at', 'updated_at']
        read_only_fields = ['user']

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
