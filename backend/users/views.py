from rest_framework import generics, permissions, status, filters, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer, RegisterSerializer, TeamInviteSerializer, TeamSerializer, UserUpdateSerializer
from .models import User, TeamInvite, Role, Team

# Existing views...
# ... (RegisterView, UserProfileView, UserListView)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(lead=self.request.user)

class TeamInviteViewSet(viewsets.ModelViewSet):
    queryset = TeamInvite.objects.all()
    serializer_class = TeamInviteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        role_name = self.request.data.get('role_name', 'EMPLOYEE')
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            role = Role.objects.get(name='EMPLOYEE')
        
        serializer.save(invited_by=self.request.user, role=role)

    def get_queryset(self):
        # Admins see all, others see what they invited?
        # For now, let's keep it simple: all authenticated can list?
        # Actually, let's just filter by PENDING for the team page.
        return TeamInvite.objects.filter(status='PENDING')

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

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
