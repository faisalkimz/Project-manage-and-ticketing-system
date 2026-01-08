from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import pyotp
import uuid
from django.utils import timezone

# Removed Role/Permission models to simplify migration/usage
# class Role(models.Model): ...
# class Permission(models.Model): ...

class Enterprise(models.Model):
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, unique=True, help_text="e.g. company.com")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Security Features
    sso_enabled = models.BooleanField(default=False)
    sso_provider = models.CharField(max_length=50, blank=True, choices=[('GOOGLE', 'Google'), ('OKTA', 'Okta'), ('AZURE', 'Azure')])
    sso_metadata = models.JSONField(default=dict, blank=True)
    ip_whitelist = models.JSONField(default=list, blank=True, help_text="List of allowed IPs")
    enforce_ip_whitelist = models.BooleanField(default=False)

    # Branding & White-labeling (Feature 20)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#0052CC')
    secondary_color = models.CharField(max_length=7, default='#172B4D')
    custom_domain = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return self.name

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=50) # FREE, PRO, ENTERPRISE
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    max_users = models.IntegerField(default=10)
    max_storage_gb = models.IntegerField(default=5)
    features = models.JSONField(default=dict) # {"ai_enabled": true, "sso": false}

    def __str__(self):
        return self.name

class EnterpriseSubscription(models.Model):
    enterprise = models.OneToOneField(Enterprise, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    billing_email = models.EmailField()

class Team(models.Model):
    # Keep UUID primary key to match migration and DB
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    members = models.ManyToManyField('users.User', related_name='teams', blank=True)
    lead = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='led_teams')
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='teams', null=True, blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    # Keep UUID primary key to match current DB schema
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)

    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('MEMBER', 'Member'),
        ('GUEST', 'Guest'),
        ('EMPLOYEE', 'Employee'),
    ]
    
    # Role as CharField to avoid migration conflict with existing data
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    bio = models.TextField(blank=True, null=True)
    
    # Renamed/Restored fields to match Serializer
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True) 
    department = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    task_updates_only = models.BooleanField(default=False)
    
    # Feature 17: Compliance & 2FA
    is_2fa_enabled = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    backup_codes = models.JSONField(default=list, blank=True)
    
    # Feature 20: Localization
    language = models.CharField(max_length=10, default='en-us')
    timezone = models.CharField(max_length=50, default='UTC')
    theme_preference = models.CharField(max_length=10, default='LIGHT', choices=[('LIGHT', 'Light'), ('DARK', 'Dark')])

    # Security Tracking
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    ip_whitelist = models.JSONField(default=list, blank=True)
    enforce_ip_whitelist = models.BooleanField(default=False)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)

    # Notifications
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)

    def generate_otp_secret(self):
        self.otp_secret = pyotp.random_base32()
        self.save()
        return self.otp_secret

    def get_totp_uri(self):
        if not self.otp_secret:
            return None
        return pyotp.totp.TOTP(self.otp_secret).provisioning_uri(
            name=self.email, 
            issuer_name=self.enterprise.name if self.enterprise else "ProjectManager"
        )

    def verify_otp(self, token):
        if not self.otp_secret:
            return False
        totp = pyotp.totp.TOTP(self.otp_secret)
        return totp.verify(token)

class TeamInvite(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=100, unique=True)
    # Role as CharField
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES, default='MEMBER')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invites')
    status = models.CharField(max_length=20, default='PENDING', choices=[('PENDING','Pending'), ('ACCEPTED', 'Accepted')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invite for {self.email}"

class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_type = models.CharField(max_length=20, default='desktop')
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

class OAuthConnection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='oauth_connections')
    provider = models.CharField(max_length=20) # google, github, slack
    provider_user_id = models.CharField(max_length=255)
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True, null=True)
    scopes = models.TextField()
    expires_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
