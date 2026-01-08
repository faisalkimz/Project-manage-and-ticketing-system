import os, sys
import django

# Make sure project root is on sys.path so Django settings can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Team
from projects.models import Project
from tickets.models import Ticket
from django.utils import timezone

User = get_user_model()

print('🌱 Running minimal seed...')

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        'admin',
        'admin@example.com',
        'admin123',
        role='ADMIN',
        bio='',
        department='',
        email_notifications=True,
        push_notifications=True,
        task_updates_only=False,
        backup_codes=[],
        enforce_ip_whitelist=False,
        failed_login_attempts=0,
        ip_whitelist=[],
        is_2fa_enabled=False,
        otp_secret='',
        job_title='',
    )
    print(' - created admin')
else:
    print(' - admin exists')

if not User.objects.filter(username='michael.k').exists():
    u = User.objects.create_user(
        'michael.k',
        'michael.k@example.com',
        'pass123',
        role='DEVELOPER',
        is_active=True,
        bio='',
        department='',
        email_notifications=True,
        push_notifications=True,
        task_updates_only=False,
        backup_codes=[],
        enforce_ip_whitelist=False,
        failed_login_attempts=0,
        ip_whitelist=[],
        is_2fa_enabled=False,
        otp_secret='',
        job_title='',
    )
    print(' - created michael.k')
else:
    u = User.objects.get(username='michael.k')
    print(' - michael.k exists')

# create a team and project
team, _ = Team.objects.get_or_create(name='Core Engineering', defaults={'description': 'Backend team'})
team.members.add(u)
project, _ = Project.objects.get_or_create(name='Omni-PMS Redesign', defaults={'description': 'Seed project', 'created_by': u, 'team': team, 'start_date': timezone.now().date()})
Ticket.objects.get_or_create(title='Seed Ticket', defaults={'description': 'Seeded ticket', 'category': 'BUG', 'priority': 'LOW', 'submitted_by': u})

print('✅ Minimal seed complete')