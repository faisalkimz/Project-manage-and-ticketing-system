from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import LoginView, RegisterView, UserProfileView, UserListView, TeamInviteViewSet, TeamViewSet, UserDetailView, ChangePasswordView, SocialAuthView, SocialAuthCallbackView, SendVerificationEmailView, VerifyEmailView, TwoFactorView, two_factor_login

router = DefaultRouter()
router.register(r'invites', TeamInviteViewSet)
router.register(r'teams', TeamViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/<str:provider>/', SocialAuthView.as_view(), name='social-auth'),
    path('auth/<str:provider>/callback/', SocialAuthCallbackView.as_view(), name='social-auth-callback'),
    path('send-verification/', SendVerificationEmailView.as_view(), name='send-verification'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('2fa/login/', two_factor_login, name='two-factor-login'),
    path('2fa/<str:action>/', TwoFactorView.as_view(), name='two-factor'),
]
