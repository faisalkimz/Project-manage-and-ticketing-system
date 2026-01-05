import os
import django
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Role, Permission
from projects.models import Project, Task, Tag
from tickets.models import Ticket
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def seed():
    print("🌱 Seeding database with Enterprise RBAC Data...")

    # 1. Create Permissions
    print("... Creating Permissions")
    permissions_data = [
        # Ticket Permissions
        ('ticket.create', 'ticket', 'create', 'Can create tickets'),
        ('ticket.view_own', 'ticket', 'view_own', 'Can view own tickets'),
        ('ticket.view_all', 'ticket', 'view_all', 'Can view all tickets'),
        ('ticket.manage', 'ticket', 'manage', 'Can update/delete any ticket'),
        ('ticket.assign', 'ticket', 'assign', 'Can assign tickets'),
        
        # Project/Task Permissions
        ('project.create', 'project', 'create', 'Can create projects'),
        ('project.view', 'project', 'view', 'Can view projects'),
        ('task.create', 'task', 'create', 'Can create tasks'),
        ('task.manage', 'task', 'manage', 'Can manage tasks'),
        
        # Admin Permissions
        ('user.manage', 'user', 'manage', 'Can manage users'),
        ('system.audit', 'system', 'audit', 'Can view audit logs'),
    ]

    all_perms = {}
    for name, res, act, desc in permissions_data:
        p, _ = Permission.objects.get_or_create(
            name=name,
            defaults={'resource': res, 'action': act, 'description': desc}
        )
        all_perms[name] = p

    # 2. Create Roles
    print("... Creating Roles")
    roles = {}
    
    # ADMIN
    admin_role, _ = Role.objects.get_or_create(name='ADMIN', defaults={'is_system_role': True})
    admin_role.permissions.set(all_perms.values()) # Admin has all permissions
    roles['ADMIN'] = admin_role

    # DEVELOPER
    dev_role, _ = Role.objects.get_or_create(name='DEVELOPER', defaults={'is_system_role': True})
    dev_perms = [
        'ticket.create', 'ticket.view_all', 'ticket.manage', 'ticket.assign',
        'project.view', 'task.create', 'task.manage'
    ]
    dev_role.permissions.set([all_perms[p] for p in dev_perms])
    roles['DEVELOPER'] = dev_role

    # EMPLOYEE
    emp_role, _ = Role.objects.get_or_create(name='EMPLOYEE', defaults={'is_system_role': True})
    emp_perms = ['ticket.create', 'ticket.view_own']
    emp_role.permissions.set([all_perms[p] for p in emp_perms])
    roles['EMPLOYEE'] = emp_role

    # PROJECT_MANAGER
    pm_role, _ = Role.objects.get_or_create(name='PROJECT_MANAGER', defaults={'is_system_role': True})
    pm_perms = dev_perms + ['project.create']
    pm_role.permissions.set([all_perms[p] for p in pm_perms])
    roles['PROJECT_MANAGER'] = pm_role

    # 3. Create Users
    print("... Creating Users")
    
    # Admin
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role=roles['ADMIN'])
        print("   - Superuser 'admin' created.")
    else:
        u = User.objects.get(username='admin')
        u.role = roles['ADMIN']
        u.save()

    # Staff Data
    staff_data = [
        ('sarah.j', 'EMPLOYEE'),
        ('michael.k', 'DEVELOPER'),
        ('luna.dev', 'PROJECT_MANAGER'),
        ('alex.pm', 'DEVELOPER')
    ]

    users_map = {}
    users_map['admin'] = User.objects.get(username='admin')

    for uname, role_name in staff_data:
        if not User.objects.filter(username=uname).exists():
            u = User.objects.create_user(username=uname, email=f'{uname}@example.com', password='pass123', role=roles[role_name])
            print(f"   - User '{uname}' created as {role_name}")
        else:
            u = User.objects.get(username=uname)
            u.role = roles[role_name]
            u.save()
        users_map[uname] = u
            
    # 4. Create Tags
    print("... Creating Tags")
    tag_data = [
        ('Frontend', '#6366F1'),
        ('Backend', '#8B5CF6'),
        ('Bug', '#EF4444'),
        ('Feature', '#10B981'),
        ('Urgent', '#F59E0B'),
        ('Design', '#EC4899')
    ]
    tags = []
    for name, color in tag_data:
        tag, _ = Tag.objects.get_or_create(name=name, defaults={'color': color})
        tags.append(tag)
    
    # 5. Create Projects
    print("... Creating Projects")
    project_data = [
        ('Omni-PMS Redesign', 'Complete overhaul of the project management system with human-centric design approach.', users_map['admin']),
        ('Customer Portal 2.0', 'Modernizing the customer interaction gateway with real-time support integration.', users_map['luna.dev']),
        ('AI Integration Engine', 'Internal workspace for developing LLM-powered ticket categorization services.', users_map['michael.k'])
    ]
    
    projects = []
    for name, desc, lead in project_data:
        p, created = Project.objects.get_or_create(
            name=name, 
            defaults={
                'description': desc,
                'created_by': lead,
                'start_date': timezone.now().date()
            }
        )
        p.members.add(users_map['admin'], users_map['michael.k'], users_map['luna.dev'], users_map['alex.pm'])
        projects.append(p)

    # 6. Create Tasks
    print("... Creating Tasks")
    task_data = [
        (projects[0], 'Implement Light Mode Theme', 'Update all CSS variables to match the slate/indigo palette.', 'DONE', 'HIGH', users_map['michael.k'], tags[0]),
        (projects[0], 'Auth Store Refactor', 'Transition from local state to Zustand for persistent session management.', 'IN_PROGRESS', 'MEDIUM', users_map['alex.pm'], tags[1]),
        (projects[1], 'API Rate Limiting', 'Implement protection against brute force on the login endpoint.', 'TODO', 'CRITICAL', users_map['michael.k'], tags[1]),
        (projects[1], 'UI Component Library', 'Develop a set of reusable React components based on Figma specs.', 'REVIEW', 'MEDIUM', users_map['sarah.j'], tags[5]),
        (projects[2], 'Dataset Preparation', 'Clean and tokenize 50k support tickets for training.', 'TODO', 'HIGH', users_map['alex.pm'], tags[1]),
    ]
    
    for proj, title, desc, status, priority, assignee, tag in task_data:
        t, created = Task.objects.get_or_create(
            project=proj,
            title=title,
            defaults={
                'description': desc,
                'status': status,
                'priority': priority,
                'assigned_to': assignee,
                'due_date': timezone.now().date() + timedelta(days=7)
            }
        )
        t.tags.add(tag)

    # 7. Create Tickets
    print("... Creating Tickets")
    ticket_data = [
        ('Database Connection Timeout', 'Unexpected timeouts occurring in production every 4 hours.', 'BUG', 'CRITICAL', users_map['michael.k']),
        ('New Logo Implementation', 'Need to update the sidebar logo with the new SVG assets.', 'FEATURE', 'LOW', users_map['sarah.j']),
        ('Password Reset Loop', 'Users are reporting they cannot reset passwords.', 'IT_SUPPORT', 'HIGH', users_map['alex.pm']),
    ]
    
    for title, desc, cat, prio, sub in ticket_data:
        ti, created = Ticket.objects.get_or_create(
            title=title,
            defaults={
                'description': desc,
                'category': cat,
                'priority': prio,
                'submitted_by': sub
            }
        )

    print("✅ Seeding complete successfully!")

if __name__ == '__main__':
    seed()
