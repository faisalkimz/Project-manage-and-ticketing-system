from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from projects.models import Project, Task
from tickets.models import Ticket
from knowledge.models import Document, WikiPage
from users.models import User

class SearchViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Global search across the entire system"""
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'all')
        
        if not query:
            return Response([])
            
        results = []
        user = request.user
        
        # Search Projects
        if search_type in ['all', 'projects']:
            projects = Project.objects.filter(
                (Q(name__icontains=query) | Q(description__icontains=query)) &
                Q(members=user)
            ).distinct()[:5]
            
            for p in projects:
                results.append({
                    'type': 'PROJECT',
                    'id': p.id,
                    'title': p.name,
                    'preview': p.description[:100] if p.description else '',
                    'url': f'/projects/{p.id}'
                })
        
        # Search Tasks
        if search_type in ['all', 'tasks']:
            tasks = Task.objects.filter(
                (Q(title__icontains=query) | Q(description__icontains=query)) &
                Q(project__members=user)
            ).distinct()[:10]
            
            for t in tasks:
                results.append({
                    'type': 'TASK',
                    'id': t.id,
                    'title': t.title,
                    'preview': f"{t.project.name} - {t.status}",
                    'url': f'/projects/{t.project.id}/tasks/{t.id}'
                })
                
        # Search Tickets
        if search_type in ['all', 'tickets']:
            tickets = Ticket.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query) | Q(ticket_number__icontains=query)
            ).filter(Q(submitted_by=user) | Q(assigned_to=user)).distinct()[:10]
            
            for t in tickets:
                results.append({
                    'type': 'TICKET',
                    'id': t.id,
                    'title': f"{t.ticket_number}: {t.title}",
                    'preview': t.status,
                    'url': f'/tickets/{t.id}'
                })
                
        # Search Users
        if search_type in ['all', 'users']:
            users = User.objects.filter(
                Q(username__icontains=query) | Q(email__icontains=query)
            )[:5]
            
            for u in users:
                results.append({
                    'type': 'USER',
                    'id': str(u.id),
                    'title': u.username,
                    'preview': u.email,
                    'url': f'/users/{u.id}'
                })
                
        # Search Knowledge
        if search_type in ['all', 'knowledge']:
            docs = Document.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            ).filter(Q(is_public=True) | Q(uploaded_by=user))[:5]
            
            for d in docs:
                results.append({
                    'type': 'DOCUMENT',
                    'id': d.id,
                    'title': d.title,
                    'preview': d.file.name,
                    'url': f'/knowledge/documents/{d.id}'
                })
                
            wiki_pages = WikiPage.objects.filter(
                Q(title__icontains=query) | Q(content__icontains=query)
            ).filter(Q(is_public=True) | Q(created_by=user))[:5]
            
            for w in wiki_pages:
                results.append({
                    'type': 'WIKI',
                    'id': w.id,
                    'title': w.title,
                    'preview': w.slug,
                    'url': f'/knowledge/wiki/{w.slug}'
                })

        return Response(results)
