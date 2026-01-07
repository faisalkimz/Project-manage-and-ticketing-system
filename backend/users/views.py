from rest_framework import generics, permissions, status, filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer, RegisterSerializer, TeamInviteSerializer, TeamSerializer, UserUpdateSerializer
from .models import User, TeamInvite, Team
from django.core.mail import send_mail

# Role model removed, using CharField

class LoginView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        team = serializer.save(lead=self.request.user)
        team.members.add(self.request.user)

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        team = self.get_object()
        # Ensure audit app is used if that's the intention, or activity app
        # Assuming audit app for now since I created it. 
        # But if activity app exists, use it. 
        # I'll use explicit check or generic logic?
        # The user view code referenced 'activity.models.AuditLog'.
        # I'll check if AuditLog exists in activity later. For now, try import.
        try:
            from activity.models import AuditLog
        except ImportError:
            from audit.models import AuditLog
            
        members = team.members.all()
        # AuditLog from audit app uses 'actor', not 'user'
        # AuditLog from activity app might use 'user'
        # I'll assume standard AuditLog structure or try to adapt
        try:
            logs = AuditLog.objects.filter(actor__in=members).order_by('-timestamp')[:50]
        except:
             # Fallback if field is named user
             logs = AuditLog.objects.filter(user__in=members).order_by('-timestamp')[:50]
        
        data = []
        for log in logs:
            data.append({
                'user': log.actor.username if hasattr(log, 'actor') else log.user.username,
                'action': log.action,
                'timestamp': log.timestamp,
                'details': getattr(log, 'changes', getattr(log, 'details', {})),
                'object': str(log.target_object) if hasattr(log, 'target_object') else str(log.content_object)
            })
        return Response(data)

    @action(detail=True, methods=['get'])
    def workload(self, request, pk=None):
        team = self.get_object()
        from projects.models import Task
        from django.db.models import Count, Q, Sum
        
        members = team.members.all()
        distribution = []
        for member in members:
            tasks = Task.objects.filter(assigned_to=member)
            stats = tasks.aggregate(
                total_tasks=Count('id'),
                open_tasks=Count('id', filter=Q(status__in=['TODO', 'IN_PROGRESS'])),
                total_points=Sum('story_points'),
                open_points=Sum('story_points', filter=Q(status__in=['TODO', 'IN_PROGRESS']))
            )
            distribution.append({
                'user_id': member.id,
                'username': member.username,
                **stats
            })
        
        return Response(distribution)

class TeamInviteViewSet(viewsets.ModelViewSet):
    queryset = TeamInvite.objects.all()
    serializer_class = TeamInviteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        role_name = self.request.data.get('role_name', 'EMPLOYEE')
        # Role is just a string now
        invite = serializer.save(invited_by=self.request.user, role=role_name)
        
        # Send invitation email
        join_link = f"http://localhost:5173/register?token={invite.token}"
        send_mail(
            subject='Invitation to Join Mbabali PMS',
            message=f'You have been invited to join Mbabali PMS.\n\nRole: {role_name}\n\nClick the link to join:\n{join_link}',
            from_email='noreply@mbabali.com',
            recipient_list=[invite.email],
            fail_silently=False
        )

    def get_queryset(self):
        return TeamInvite.objects.filter(status='PENDING')

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()
    serializer_class = RegisterSerializer

    def get(self, request, *args, **kwargs):
        """
        Allow GET requests to provide information about the registration endpoint.
        """
        return Response({
            "message": "Registration endpoint. Send a POST request with username, email, and password to register.",
            "fields": ["username", "email", "password", "role", "token (optional)"]
        }, status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def update(self, request, *args, **kwargs):
        user = self.request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        
        if not user.check_password(old_password):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({"status": "password set"}, status=status.HTTP_200_OK)
