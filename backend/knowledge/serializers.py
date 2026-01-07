from rest_framework import serializers
from .models import Document, WikiPage, WikiPageVersion, Folder, SavedView
from django.contrib.auth import get_user_model

User = get_user_model()

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_details = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'file_size', 'file_type', 'created_at', 'updated_at']
    
    def get_uploaded_by_details(self, obj):
        if obj.uploaded_by:
            return {
                'id': obj.uploaded_by.id,
                'username': obj.uploaded_by.username,
                'email': obj.uploaded_by.email
            }
        return None
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

class WikiPageSerializer(serializers.ModelSerializer):
    created_by_details = serializers.SerializerMethodField()
    last_edited_by_details = serializers.SerializerMethodField()
    child_pages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = WikiPage
        fields = '__all__'
        read_only_fields = ['created_by', 'last_edited_by', 'created_at', 'updated_at', 'view_count', 'slug']
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'username': obj.created_by.username}
        return None
    
    def get_last_edited_by_details(self, obj):
        if obj.last_edited_by:
            return {'id': obj.last_edited_by.id, 'username': obj.last_edited_by.username}
        return None
    
    def get_child_pages_count(self, obj):
        return obj.child_pages.count()

class WikiPageVersionSerializer(serializers.ModelSerializer):
    edited_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = WikiPageVersion
        fields = '__all__'
        read_only_fields = ['edited_by', 'created_at']
    
    def get_edited_by_details(self, obj):
        if obj.edited_by:
            return {'id': obj.edited_by.id, 'username': obj.edited_by.username}
        return None

class FolderSerializer(serializers.ModelSerializer):
    created_by_details = serializers.SerializerMethodField()
    subfolder_count = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Folder
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'username': obj.created_by.username}
        return None
    
    def get_subfolder_count(self, obj):
        return obj.subfolders.count()
    
    def get_document_count(self, obj):
        # Count documents in this folder (if we add folder FK to Document later)
        return 0

class SavedViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedView
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
