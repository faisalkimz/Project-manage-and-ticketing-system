import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Team
from projects.models import Project, Task, Tag
from tickets.models import Ticket, SLAPolicy
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def seed():
    print("Seeding database...")

    print("... Creating Users")

    staff_data = [
        ('sarah.j', 'EMPLOYEE'),
        ('michael.k', 'DEVELOPER'),
        ('luna.dev', 'PROJECT_MANAGER'),
        ('alex.pm', 'DEVELOPER'),
    ]

    users_map = {}

    if not User.objects.filter(username='admin').exists():
        u = User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='ADMIN')
        print("   - Superuser 'admin' created.")
    else:
        u = User.objects.get(username='admin')
        u.role = 'ADMIN'
        u.save()
    users_map['admin'] = u

    for uname, role_name in staff_data:
        if not User.objects.filter(username=uname).exists():
            u = User.objects.create_user(
                username=uname, email=f'{uname}@example.com',
                password='pass123', role=role_name
            )
            print(f"   - User '{uname}' created as {role_name}")
        else:
            u = User.objects.get(username=uname)
            u.role = role_name
            u.save()
        users_map[uname] = u

    print("... Creating Tags")
    tag_data = [
        ('Frontend', '#6366F1'), ('Backend', '#8B5CF6'),
        ('Bug', '#EF4444'), ('Feature', '#10B981'),
        ('Urgent', '#F59E0B'), ('Design', '#EC4899'),
    ]
    tags = []
    for name, color in tag_data:
        tag, _ = Tag.objects.get_or_create(name=name, defaults={'color': color})
        tags.append(tag)

    print("... Creating SLA Policies")
    sla_data = [
        ('Crucial Response', 'CRITICAL', 1, 4),
        ('High Velocity', 'HIGH', 4, 24),
        ('Standard Ops', 'MEDIUM', 8, 48),
        ('Low Priority', 'LOW', 24, 72),
    ]
    for name, prio, resp, res_time in sla_data:
        SLAPolicy.objects.get_or_create(
            priority=prio,
            defaults={
                'name': name, 'description': f'Policy for {prio} priority items',
                'response_time_hours': resp, 'resolution_time_hours': res_time,
            }
        )

    print("... Creating Teams")
    team_data = [
        ('Core Engineering', 'Responsible for the core engine, API architecture, and performance optimization.', users_map['michael.k']),
        ('Product Design', 'Visual designers and UX researchers focusing on human-centric aesthetics.', users_map['sarah.j']),
        ('Customer Success', 'Ensuring our clients get the most out of Omni-PMS through support and advocacy.', users_map['luna.dev']),
    ]
    for name, desc, lead in team_data:
        t, _ = Team.objects.get_or_create(
            name=name, defaults={'description': desc, 'lead': lead}
        )
        t.members.add(users_map['admin'], users_map['michael.k'], users_map['luna.dev'], users_map['alex.pm'], users_map['sarah.j'])

    print("... Creating Projects")
    eng_team = Team.objects.get(name='Core Engineering')
    design_team = Team.objects.get(name='Product Design')
    success_team = Team.objects.get(name='Customer Success')

    project_data = [
        ('Omni-PMS Redesign', 'Complete overhaul of the project management system with human-centric design approach.', users_map['admin'], design_team),
        ('Customer Portal 2.0', 'Modernizing the customer interaction gateway with real-time support integration.', users_map['luna.dev'], success_team),
        ('AI Integration Engine', 'Internal workspace for developing LLM-powered ticket categorization services.', users_map['michael.k'], eng_team),
    ]
    projects = []
    for name, desc, lead, team in project_data:
        p, _ = Project.objects.get_or_create(
            name=name,
            defaults={
                'description': desc, 'created_by': lead, 'team': team,
                'start_date': timezone.now().date(),
            }
        )
        p.members.add(users_map['admin'], users_map['michael.k'], users_map['luna.dev'], users_map['alex.pm'])
        projects.append(p)

    print("... Creating Tasks")
    task_data = [
        (projects[0], 'Implement Light Mode Theme', 'Update all CSS variables to match the slate/indigo palette.', 'DONE', 'HIGH', users_map['michael.k'], tags[0]),
        (projects[0], 'Auth Store Refactor', 'Transition from local state to Zustand for persistent session management.', 'IN_PROGRESS', 'MEDIUM', users_map['alex.pm'], tags[1]),
        (projects[1], 'API Rate Limiting', 'Implement protection against brute force on the login endpoint.', 'TODO', 'CRITICAL', users_map['michael.k'], tags[1]),
        (projects[1], 'UI Component Library', 'Develop a set of reusable React components based on Figma specs.', 'REVIEW', 'MEDIUM', users_map['sarah.j'], tags[5]),
        (projects[2], 'Dataset Preparation', 'Clean and tokenize 50k support tickets for training.', 'TODO', 'HIGH', users_map['alex.pm'], tags[1]),
    ]
    for proj, title, desc, st, priority, assignee, tag in task_data:
        t, _ = Task.objects.get_or_create(
            project=proj, title=title,
            defaults={
                'description': desc, 'status': st, 'priority': priority,
                'assigned_to': assignee,
                'due_date': timezone.now().date() + timedelta(days=7),
            }
        )
        t.tags.add(tag)

    print("... Creating Tickets")
    ticket_data = [
        ('Database Connection Timeout', 'Unexpected timeouts occurring in production every 4 hours.', 'BUG', 'CRITICAL', users_map['michael.k']),
        ('New Logo Implementation', 'Need to update the sidebar logo with the new SVG assets.', 'FEATURE', 'LOW', users_map['sarah.j']),
        ('Password Reset Loop', 'Users are reporting they cannot reset passwords.', 'IT_SUPPORT', 'HIGH', users_map['alex.pm']),
        ('Email Service Down', 'SMTP relay is not connecting.', 'IT_SUPPORT', 'CRITICAL', users_map['sarah.j']),
        ('Dark Mode Toggle', 'Request to add dark mode back.', 'FEATURE', 'MEDIUM', users_map['luna.dev']),
    ]
    for title, desc, cat, prio, sub in ticket_data:
        ti, _ = Ticket.objects.get_or_create(
            title=title,
            defaults={
                'description': desc, 'category': cat, 'priority': prio,
                'submitted_by': sub,
            }
        )
        if not ti.sla_due_date:
            ti.calculate_sla()
            ti.save()

    print("Seeding complete!")

if __name__ == '__main__':
    seed()
