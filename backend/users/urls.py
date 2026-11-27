from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    LoginView, RegisterView, UserProfileView, UserListView,
    TeamInviteViewSet, TeamViewSet, UserDetailView, ChangePasswordView,
    OAuthConnectionsView, TwoFactorSetupView, TwoFactorVerifyView, TwoFactorDisableView,
    WorkspaceViewSet
)
from .scim import SCIMUsersView, SCIMUserDetailView

router = DefaultRouter()
router.register(r'invites', TeamInviteViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'workspaces', WorkspaceViewSet, basename='workspaces')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('oauth/', OAuthConnectionsView.as_view(), name='oauth-connections'),
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('scim/v2/Users', SCIMUsersView.as_view(), name='scim-users'),
    path('scim/v2/Users/<int:pk>', SCIMUserDetailView.as_view(), name='scim-user-detail'),
]
