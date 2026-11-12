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
        """Global search across the entire system with multi-tenant isolation"""
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'all')
        
        if not query:
            return Response([])
            
        results = []
        user = request.user
        
        # Scoped Projects
        if user.is_superuser:
            accessible_projects = Project.objects.all()
        elif getattr(user, 'enterprise', None):
            accessible_projects = Project.objects.filter(
                Q(team__enterprise=user.enterprise) | Q(members=user) | Q(created_by=user)
            ).distinct()
        else:
            accessible_projects = Project.objects.filter(
                Q(members=user) | Q(team__members=user) | Q(created_by=user)
            ).distinct()

        # Search Projects
        if search_type in ['all', 'projects']:
            projects = accessible_projects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            ).distinct()[:10]
            
            for p in projects:
                results.append({
                    'type': 'PROJECT',
                    'id': p.id,
                    'title': p.name,
                    'preview': p.description[:100] if p.description else f"{p.status} • {p.members.count()} members",
                    'url': f'/projects/{p.id}'
                })
        
        # Search Tasks
        if search_type in ['all', 'tasks']:
            tasks = Task.objects.filter(
                (Q(title__icontains=query) | Q(description__icontains=query)) &
                (Q(project__in=accessible_projects) | Q(assigned_to=user))
            ).distinct()[:15]
            
            for t in tasks:
                results.append({
                    'type': 'TASK',
                    'id': t.id,
                    'title': t.title,
                    'preview': f"{t.project.name} • {t.status} • {t.priority}",
                    'url': f'/projects/{t.project.id}?task={t.id}'
                })
                
        # Search Tickets
        if search_type in ['all', 'tickets']:
            if user.is_superuser:
                tickets_qs = Ticket.objects.all()
            elif getattr(user, 'enterprise', None):
                tickets_qs = Ticket.objects.filter(
                    Q(submitted_by__enterprise=user.enterprise) |
                    Q(assigned_to__enterprise=user.enterprise) |
                    Q(project_task__project__in=accessible_projects)
                ).distinct()
            else:
                tickets_qs = Ticket.objects.filter(
                    Q(submitted_by=user) | Q(assigned_to=user) | Q(project_task__project__in=accessible_projects)
                ).distinct()

            tickets = tickets_qs.filter(
                Q(title__icontains=query) | Q(description__icontains=query) | Q(ticket_number__icontains=query)
            ).distinct()[:10]
            
            for t in tickets:
                results.append({
                    'type': 'TICKET',
                    'id': t.id,
                    'title': f"#{t.ticket_number or t.id}: {t.title}",
                    'preview': f"{t.status} • {t.priority}",
                    'url': f'/tickets/{t.id}'
                })
                
        # Search Users / Team
        if search_type in ['all', 'users']:
            if user.is_superuser:
                users_qs = User.objects.all()
            elif getattr(user, 'enterprise', None):
                users_qs = User.objects.filter(enterprise=user.enterprise)
            else:
                users_qs = User.objects.filter(Q(id=user.id) | Q(teams__in=user.teams.all())).distinct()

            users = users_qs.filter(
                Q(username__icontains=query) | Q(email__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
            )[:10]
            
            for u in users:
                results.append({
                    'type': 'USER',
                    'id': str(u.id),
                    'title': u.get_full_name() or u.username,
                    'preview': f"{u.email} • {u.role}",
                    'url': f'/team'
                })
                
        # Search Knowledge Base & Wiki
        if search_type in ['all', 'knowledge', 'wiki']:
            docs = Document.objects.filter(
                (Q(title__icontains=query) | Q(description__icontains=query)) &
                (Q(is_public=True) | Q(uploaded_by=user) | Q(project__in=accessible_projects))
            ).distinct()[:10]
            
            for d in docs:
                results.append({
                    'type': 'DOCUMENT',
                    'id': d.id,
                    'title': d.title,
                    'preview': f"Document • {d.category or 'General'}",
                    'url': '/knowledge'
                })
                
            wiki_pages = WikiPage.objects.filter(
                (Q(title__icontains=query) | Q(content__icontains=query)) &
                (Q(is_public=True) | Q(created_by=user) | Q(project__in=accessible_projects))
            ).distinct()[:10]
            
            for w in wiki_pages:
                results.append({
                    'type': 'WIKI',
                    'id': w.id,
                    'title': w.title,
                    'preview': f"Wiki • {w.category or 'General'}",
                    'url': f'/knowledge?wiki={w.slug}'
                })

        return Response(results)
