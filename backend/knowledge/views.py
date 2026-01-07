from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.utils.text import slugify
from .models import Document, WikiPage, WikiPageVersion, Folder, SavedView
from .serializers import (
    DocumentSerializer, WikiPageSerializer, WikiPageVersionSerializer,
    FolderSerializer, SavedViewSerializer
)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        # Show public documents or documents the user has access to
        return Document.objects.filter(
            Q(is_public=True) | 
            Q(uploaded_by=user) | 
            Q(allowed_users=user)
        ).distinct()
    
    def perform_create(self, serializer):
        # Auto-set file metadata
        file_obj = self.request.FILES.get('file')
        if file_obj:
            serializer.save(
                uploaded_by=self.request.user,
                file_size=file_obj.size,
                file_type=file_obj.content_type
            )
        else:
            serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """Create a new version of a document"""
        document = self.get_object()
        new_file = request.FILES.get('file')
        
        if not new_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new version
        new_version = Document.objects.create(
            title=document.title,
            description=document.description,
            category=document.category,
            file=new_file,
            file_size=new_file.size,
            file_type=new_file.content_type,
            uploaded_by=request.user,
            version=document.version + 1,
            parent_version=document,
            content_type=document.content_type,
            object_id=document.object_id
        )
        
        return Response(DocumentSerializer(new_version).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search documents by title, description, or tags"""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        results = self.get_queryset().filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query) |
            Q(tags__name__icontains=query)
        ).distinct()
        
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)

class WikiPageViewSet(viewsets.ModelViewSet):
    queryset = WikiPage.objects.all()
    serializer_class = WikiPageSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'
    
    def get_queryset(self):
        user = self.request.user
        return WikiPage.objects.filter(
            Q(is_public=True) | 
            Q(created_by=user) | 
            Q(allowed_viewers=user) |
            Q(allowed_editors=user)
        ).distinct()
    
    def perform_create(self, serializer):
        # Auto-generate slug
        title = serializer.validated_data.get('title')
        slug = slugify(title)
        
        # Ensure unique slug
        original_slug = slug
        counter = 1
        while WikiPage.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        page = serializer.save(
            created_by=self.request.user,
            last_edited_by=self.request.user,
            slug=slug
        )
        
        # Create initial version
        WikiPageVersion.objects.create(
            page=page,
            content=page.content,
            edited_by=self.request.user,
            change_summary="Initial version"
        )
    
    def perform_update(self, serializer):
        page = serializer.save(last_edited_by=self.request.user)
        
        # Create version history
        change_summary = self.request.data.get('change_summary', 'Updated')
        WikiPageVersion.objects.create(
            page=page,
            content=page.content,
            edited_by=self.request.user,
            change_summary=change_summary
        )
    
    @action(detail=True, methods=['get'])
    def view(self, request, slug=None):
        """Increment view count when page is viewed"""
        page = self.get_object()
        page.view_count += 1
        page.save(update_fields=['view_count'])
        serializer = self.get_serializer(page)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, slug=None):
        """Get version history for a wiki page"""
        page = self.get_object()
        versions = page.versions.all()
        serializer = WikiPageVersionSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search wiki pages"""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        results = self.get_queryset().filter(
            Q(title__icontains=query) | 
            Q(content__icontains=query) |
            Q(tags__name__icontains=query)
        ).distinct()
        
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)

class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Folder.objects.filter(
            Q(created_by=user) | Q(allowed_users=user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SavedViewViewSet(viewsets.ModelViewSet):
    queryset = SavedView.objects.all()
    serializer_class = SavedViewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedView.objects.filter(
            Q(user=self.request.user) | Q(is_shared=True)
        )
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this view as the default for the user"""
        saved_view = self.get_object()
        
        # Remove default from other views of same type
        SavedView.objects.filter(
            user=request.user,
            view_type=saved_view.view_type,
            is_default=True
        ).update(is_default=False)
        
        # Set this as default
        saved_view.is_default = True
        saved_view.save()
        
        return Response({'status': 'default set'})
