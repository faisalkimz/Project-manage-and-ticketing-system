import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
django.setup()

from automation.models import AutomationTemplate
from django.contrib.contenttypes.models import ContentType

templates = [
    {
        'name': 'Auto-Close Linked Task when Ticket is Resolved',
        'description': 'When a customer support ticket is marked as Resolved, automatically update the linked sprint task status to DONE.',
        'category': 'STATUS',
        'is_system': True,
        'config_template': {
            'target_model': 'ticket',
            'trigger_type': 'STATUS_CHANGE',
            'trigger_conditions': {'status': 'RESOLVED'},
            'actions': [{'type': 'update_status', 'field': 'status', 'value': 'DONE', 'target': 'linked_task'}]
        }
    },
    {
        'name': 'Critical SLA Breach Urgent Escalation',
        'description': 'Trigger high-priority alert and auto-assign to lead when a critical ticket breaches SLA deadline.',
        'category': 'SLA',
        'is_system': True,
        'config_template': {
            'target_model': 'ticket',
            'trigger_type': 'STATUS_CHANGE',
            'trigger_conditions': {'priority': 'CRITICAL', 'sla_breached': True},
            'actions': [{'type': 'notify', 'channel': 'slack', 'message': 'Urgent: Critical SLA breached!'}]
        }
    },
    {
        'name': 'Auto-Assign Bug to Tech Lead',
        'description': 'Automatically assign newly filed Bug tasks to the development lead and set priority to HIGH.',
        'category': 'ASSIGNMENT',
        'is_system': True,
        'config_template': {
            'target_model': 'task',
            'trigger_type': 'CREATED',
            'trigger_conditions': {'issue_type': 'BUG'},
            'actions': [{'type': 'assign', 'role': 'LEAD'}, {'type': 'update_field', 'field': 'priority', 'value': 'HIGH'}]
        }
    },
    {
        'name': 'Sprint Completion Team Broadcast',
        'description': 'When all sprint tasks are marked DONE, broadcast a celebratory notification to the project team.',
        'category': 'NOTIFICATION',
        'is_system': True,
        'config_template': {
            'target_model': 'task',
            'trigger_type': 'STATUS_CHANGE',
            'trigger_conditions': {'status': 'DONE'},
            'actions': [{'type': 'notify', 'message': 'All sprint tasks delivered!'}]
        }
    }
]

for t in templates:
    obj, created = AutomationTemplate.objects.get_or_create(
        name=t['name'],
        defaults=t
    )
    status = "Created" if created else "Already Exists"
    print(f"Template [{obj.name}]: {status}")
