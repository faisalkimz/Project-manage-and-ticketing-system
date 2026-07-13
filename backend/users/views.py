import os
import secrets
from datetime import timedelta
from rest_framework import generics, permissions, status, filters, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from .serializers import UserSerializer, RegisterSerializer, TeamInviteSerializer, TeamSerializer, UserUpdateSerializer
from .models import User, TeamInvite, Team, EmailVerificationToken
from django.core.mail import send_mail
from django.core.exceptions import ValidationError

# Role model removed, using CharField

class LoginView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        if username and password:
            try:
                user = User.objects.get(username=username)
                if user.is_2fa_enabled and user.check_password(password):
                    temp_token = AccessToken.for_user(user)
                    temp_token.set_exp(lifetime=timedelta(minutes=5))
                    return Response({
                        '2fa_required': True,
                        'temp_token': str(temp_token),
                        'detail': 'Enter your 2FA code.',
                        'email_verified': user.email_verified,
                        'is_2fa_enabled': True,
                    })
            except User.DoesNotExist:
                pass
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                user = User.objects.get(username=username)
                response.data['email_verified'] = user.email_verified
                response.data['is_2fa_enabled'] = False
            except User.DoesNotExist:
                pass
        return response

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
        from audit.models import AuditLog
            
        members = team.members.all()
        logs = AuditLog.objects.filter(actor__in=members).order_by('-timestamp')[:50]
        
        data = []
        for log in logs:
            data.append({
                'user': log.actor.username,
                'action': log.action,
                'timestamp': log.timestamp,
                'details': getattr(log, 'changes', {}),
                'object': str(log.target_object) if hasattr(log, 'target_object') else ''
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
        return Response({
            "message": "Registration endpoint. Send a POST request with username, email, and password to register.",
            "fields": ["username", "email", "password", "role", "token (optional)"]
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            user = User.objects.get(username=response.data['username'])
            token = secrets.token_urlsafe(48)
            EmailVerificationToken.objects.create(user=user, token=token)
            verify_url = f"http://localhost:5173/verify-email?token={token}"
            send_mail(
                subject='Verify your email',
                message=f'Welcome! Click the link to verify your email:\n{verify_url}',
                from_email='noreply@mbabali.com',
                recipient_list=[user.email],
                fail_silently=True,
            )
            response.data['email_verified'] = False
            response.data['verify_email_sent'] = True
        return response

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return User.objects.all()
        return User.objects.filter(is_active=True).exclude(role='ADMIN')

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return User.objects.all()
        return User.objects.filter(is_active=True).exclude(role='ADMIN')

class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def update(self, request, *args, **kwargs):
        user = self.request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        
        if not user.check_password(old_password):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({"new_password": ["Password must be at least 8 characters."]}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({"new_password": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({"status": "password set"}, status=status.HTTP_200_OK)

class SocialAuthView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def get(self, request, provider):
        oauth_configs = {
            'google': {
                'authorize_url': 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_url': 'https://oauth2.googleapis.com/token',
                'scopes': 'openid email profile',
                'client_id_var': 'OAUTH_GOOGLE_CLIENT_ID',
                'client_secret_var': 'OAUTH_GOOGLE_CLIENT_SECRET',
            },
            'microsoft': {
                'authorize_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                'token_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                'scopes': 'User.Read openid email profile',
                'client_id_var': 'OAUTH_MICROSOFT_CLIENT_ID',
                'client_secret_var': 'OAUTH_MICROSOFT_CLIENT_SECRET',
            },
            'apple': {
                'authorize_url': 'https://appleid.apple.com/auth/authorize',
                'token_url': 'https://appleid.apple.com/auth/token',
                'scopes': 'name email',
                'client_id_var': 'OAUTH_APPLE_CLIENT_ID',
                'client_secret_var': 'OAUTH_APPLE_CLIENT_SECRET',
            },
            'slack': {
                'authorize_url': 'https://slack.com/oauth/v2/authorize',
                'token_url': 'https://slack.com/api/oauth.v2.access',
                'scopes': 'identity.basic,identity.email,identity.avatar',
                'client_id_var': 'OAUTH_SLACK_CLIENT_ID',
                'client_secret_var': 'OAUTH_SLACK_CLIENT_SECRET',
            },
        }

        config = oauth_configs.get(provider.lower())
        if not config:
            return Response({'detail': f'Unsupported provider: {provider}'}, status=400)

        client_id = os.getenv(config['client_id_var'])
        if not client_id:
            return Response({
                'detail': f'{provider} OAuth is not configured. Set {config["client_id_var"]} and {config["client_secret_var"]} in your environment.',
                'authorization_url': None,
            }, status=status.HTTP_501_NOT_IMPLEMENTED)

        redirect_uri = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/auth/{provider.lower()}/callback"
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': config['scopes'],
        }
        if provider.lower() == 'apple':
            params['response_mode'] = 'form_post'

        import urllib.parse
        auth_url = config['authorize_url'] + '?' + urllib.parse.urlencode(params)
        return Response({'authorization_url': auth_url})


class SocialAuthCallbackView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request, provider):
        oauth_configs = {
            'google': {
                'token_url': 'https://oauth2.googleapis.com/token',
                'userinfo_url': 'https://www.googleapis.com/oauth2/v3/userinfo',
                'client_id_var': 'OAUTH_GOOGLE_CLIENT_ID',
                'client_secret_var': 'OAUTH_GOOGLE_CLIENT_SECRET',
            },
            'microsoft': {
                'token_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                'userinfo_url': 'https://graph.microsoft.com/v1.0/me',
                'client_id_var': 'OAUTH_MICROSOFT_CLIENT_ID',
                'client_secret_var': 'OAUTH_MICROSOFT_CLIENT_SECRET',
            },
            'apple': {
                'token_url': 'https://appleid.apple.com/auth/token',
                'userinfo_url': None,
                'client_id_var': 'OAUTH_APPLE_CLIENT_ID',
                'client_secret_var': 'OAUTH_APPLE_CLIENT_SECRET',
            },
            'slack': {
                'token_url': 'https://slack.com/api/oauth.v2.access',
                'userinfo_url': 'https://slack.com/api/users.identity',
                'client_id_var': 'OAUTH_SLACK_CLIENT_ID',
                'client_secret_var': 'OAUTH_SLACK_CLIENT_SECRET',
            },
        }

        config = oauth_configs.get(provider.lower())
        if not config:
            return Response({'detail': f'Unsupported provider: {provider}'}, status=400)

        code = request.data.get('code')
        if not code:
            return Response({'detail': 'Authorization code is required.'}, status=400)

        client_id = os.getenv(config['client_id_var'])
        client_secret = os.getenv(config['client_secret_var'])
        redirect_uri = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/auth/{provider.lower()}/callback"

        if not client_id or not client_secret:
            return Response({'detail': f'{provider} OAuth is not configured.'}, status=501)

        # Exchange code for tokens
        import requests as http_requests
        token_data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }

        try:
            token_resp = http_requests.post(config['token_url'], data=token_data, timeout=10)
            token_resp.raise_for_status()
            token_info = token_resp.json()
        except Exception as e:
            return Response({'detail': f'Token exchange failed: {str(e)}'}, status=400)

        access_token = token_info.get('access_token')
        if not access_token:
            return Response({'detail': 'No access token received.'}, status=400)

        # Get user info
        email = None
        name = None
        provider_user_id = None

        if config['userinfo_url']:
            try:
                headers = {'Authorization': f'Bearer {access_token}'}
                if provider.lower() == 'slack':
                    headers = {'Authorization': f'Bearer {access_token}'}
                user_resp = http_requests.get(config['userinfo_url'], headers=headers, timeout=10)
                user_resp.raise_for_status()
                user_info = user_resp.json()
            except Exception as e:
                return Response({'detail': f'Failed to get user info: {str(e)}'}, status=400)

            if provider.lower() == 'google':
                email = user_info.get('email')
                name = user_info.get('name', email.split('@')[0] if email else 'user')
                provider_user_id = user_info.get('sub')
            elif provider.lower() == 'microsoft':
                email = user_info.get('mail') or user_info.get('userPrincipalName')
                name = user_info.get('displayName', email.split('@')[0] if email else 'user')
                provider_user_id = user_info.get('id')
            elif provider.lower() == 'slack':
                user_data = user_info.get('user', {})
                email = user_data.get('email')
                name = user_data.get('name', email.split('@')[0] if email else 'user')
                provider_user_id = user_info.get('user', {}).get('id')

        if not email:
            return Response({'detail': 'Could not get email from provider.'}, status=400)

        # Find or create user
        user = User.objects.filter(email=email).first()
        if not user:
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user = User.objects.create_user(
                username=username,
                email=email,
                password=secrets.token_urlsafe(32),
                role='MEMBER',
            )
            user.email_verified = True
            user.save()

        # Save OAuth connection
        from .models import OAuthConnection
        OAuthConnection.objects.update_or_create(
            user=user,
            provider=provider.lower(),
            defaults={
                'provider_user_id': provider_user_id or email,
                'access_token': access_token,
                'refresh_token': token_info.get('refresh_token', ''),
                'scopes': config.get('scopes', ''),
            }
        )

        # Return JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })

class SendVerificationEmailView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({'detail': 'Email already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        EmailVerificationToken.objects.filter(user=user).delete()
        token = secrets.token_urlsafe(48)
        EmailVerificationToken.objects.create(user=user, token=token)

        verify_url = f"http://localhost:5173/verify-email?token={token}"
        send_mail(
            subject='Verify your email',
            message=f'Click the link to verify your email:\n{verify_url}',
            from_email='noreply@mbabali.com',
            recipient_list=[user.email],
            fail_silently=False,
        )
        return Response({'detail': 'Verification email sent.'})

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vt = EmailVerificationToken.objects.select_related('user').get(token=token)
        except EmailVerificationToken.DoesNotExist:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        vt.user.email_verified = True
        vt.user.save()
        vt.delete()
        return Response({'detail': 'Email verified successfully.'})


class TwoFactorView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, action):
        user = request.user
        if action == 'enable':
            if user.is_2fa_enabled:
                return Response({'detail': '2FA already enabled.'}, status=status.HTTP_400_BAD_REQUEST)
            user.generate_otp_secret()
            backup_codes = [secrets.token_hex(4) for _ in range(8)]
            user.backup_codes = backup_codes
            user.save()
            return Response({
                'totp_uri': user.get_totp_uri(),
                'otp_secret': user.otp_secret,
                'backup_codes': backup_codes,
            })

        if action == 'verify-setup':
            code = request.data.get('code')
            if not code:
                return Response({'code': 'Required.'}, status=status.HTTP_400_BAD_REQUEST)
            if not user.verify_otp(code):
                return Response({'code': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)
            user.is_2fa_enabled = True
            user.save()
            return Response({'detail': '2FA enabled successfully.'})

        if action == 'disable':
            password = request.data.get('password')
            if not user.check_password(password):
                return Response({'password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
            user.is_2fa_enabled = False
            user.otp_secret = None
            user.backup_codes = []
            user.save()
            return Response({'detail': '2FA disabled.'})

        return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def two_factor_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    code = request.data.get('code')
    temp_token_str = request.data.get('temp_token')

    if temp_token_str:
        try:
            temp_token = AccessToken(temp_token_str)
            user = User.objects.get(id=temp_token['user_id'])
        except Exception:
            return Response({'detail': 'Invalid or expired temp token.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_2fa_enabled:
            return Response({'detail': '2FA not enabled for this user.'}, status=status.HTTP_400_BAD_REQUEST)

        if code:
            if user.verify_otp(code):
                refresh = RefreshToken.for_user(user)
                user.failed_login_attempts = 0
                user.save()
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                })
            if code in user.backup_codes:
                codes = list(user.backup_codes)
                codes.remove(code)
                user.backup_codes = codes
                user.failed_login_attempts = 0
                user.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'backup_code_used': True,
                })
            return Response({'code': 'Invalid code.'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({'code': 'Required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not username or not password:
        return Response({'detail': 'Username and password required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if user.is_2fa_enabled:
        temp_token = AccessToken.for_user(user)
        temp_token.set_exp(lifetime=timedelta(minutes=5))
        return Response({
            '2fa_required': True,
            'temp_token': str(temp_token),
            'detail': 'Enter your 2FA code.',
        })

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })
