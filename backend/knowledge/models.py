from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Document(models.Model):
    """File uploads and document storage"""
    class Category(models.TextChoices):
        PROJECT_DOC = 'PROJECT_DOC', 'Project Document'
        WIKI = 'WIKI', 'Wiki Page'
        NOTE = 'NOTE', 'Note'
        ATTACHMENT = 'ATTACHMENT', 'Attachment'
        RESOURCE = 'RESOURCE', 'Resource'

    # Generic relation to attach to Projects, Tasks, etc.
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    attached_to = GenericForeignKey('content_type', 'object_id')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.ATTACHMENT)
    file = models.FileField(upload_to='documents/%Y/%m/', null=True, blank=True)
    file_size = models.BigIntegerField(default=0, help_text="Size in bytes")
    file_type = models.CharField(max_length=100, blank=True)
    
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Version control
    version = models.IntegerField(default=1)
    parent_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versions')
    
    # Permissions
    is_public = models.BooleanField(default=False)
    allowed_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='accessible_documents', blank=True)
    
    # Tagging
    tags = models.ManyToManyField('projects.Tag', blank=True, related_name='documents')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class WikiPage(models.Model):
    """Internal documentation and knowledge base"""
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='wiki_pages', null=True, blank=True)
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    content = models.TextField()
    
    parent_page = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_pages')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_wiki_pages')
    last_edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='edited_wiki_pages')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Permissions
    is_public = models.BooleanField(default=True)
    allowed_viewers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='viewable_wiki_pages', blank=True)
    allowed_editors = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='editable_wiki_pages', blank=True)
    
    # Metadata
    tags = models.ManyToManyField('projects.Tag', blank=True, related_name='wiki_pages')
    is_pinned = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-is_pinned', '-updated_at']
    
    def __str__(self):
        return self.title

class WikiPageVersion(models.Model):
    """Version history for wiki pages"""
    page = models.ForeignKey(WikiPage, on_delete=models.CASCADE, related_name='versions')
    content = models.TextField()
    edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    change_summary = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.page.title} - Version {self.id}"

class Folder(models.Model):
    """Shared folders for organizing documents"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='folders', null=True, blank=True)
    parent_folder = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Permissions
    allowed_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='accessible_folders', blank=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class SavedView(models.Model):
    """Saved filters and views for reports/dashboards"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_views')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Store filter configuration as JSON
    view_type = models.CharField(max_length=50)  # 'project', 'task', 'dashboard', etc.
    filters = models.JSONField(default=dict)
    
    is_default = models.BooleanField(default=False)
    is_shared = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', 'name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
