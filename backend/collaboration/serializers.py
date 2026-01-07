from rest_framework import serializers
from .models import Notification, Announcement, ChatMessage
from django.contrib.contenttypes.models import ContentType
from users.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    actor_details = UserSerializer(source='actor', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'actor', 'actor_details', 'verb', 'content_type', 'object_id', 'description', 'is_read', 'created_at']
        read_only_fields = ['user', 'actor']

class AnnouncementSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    
    class Meta:
        model = Announcement
        fields = ['id', 'project', 'author', 'author_details', 'title', 'content', 'is_pinned', 'created_at']
        read_only_fields = ['author']

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    
    def to_internal_value(self, data):
        # Create a mutable copy if it's a QueryDict
        if hasattr(data, 'dict'):
            data = data.dict()
        else:
            data = data.copy() if isinstance(data, dict) else data

        if 'content_type' in data and isinstance(data['content_type'], str):
            try:
                # ContentType model names are stored as lowercase
                model_name = data['content_type'].lower()
                ct = ContentType.objects.get(model=model_name)
                data['content_type'] = ct.id
            except ContentType.DoesNotExist:
                pass
        return super().to_internal_value(data)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_details', 'content_type', 'object_id', 'text', 'file', 'created_at']
        read_only_fields = ['sender']
