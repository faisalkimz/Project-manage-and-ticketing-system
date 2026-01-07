from rest_framework import serializers
from .models import Notification, Announcement, ChatMessage
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
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_details', 'content_type', 'object_id', 'text', 'file', 'created_at']
        read_only_fields = ['sender']
