from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Ticket
from activity.models import AuditLog
from django.contrib.contenttypes.models import ContentType

@receiver(pre_save, sender=Ticket)
def track_ticket_changes(sender, instance, **kwargs):
    if instance.pk:
        # Get the previous version of the ticket
        previous = Ticket.objects.get(pk=instance.pk)
        changes = {}
        
        # List of fields we want to track
        fields_to_track = ['status', 'priority', 'assigned_to', 'category']
        
        for field in fields_to_track:
            old_val = getattr(previous, field)
            new_val = getattr(instance, field)
            
            # Handle ForeignKeys (assigned_to)
            if field == 'assigned_to':
                old_val = old_val.username if old_val else 'Unassigned'
                new_val = new_val.username if new_val else 'Unassigned'
            
            if old_val != new_val:
                changes[field] = {
                    'old': str(old_val),
                    'new': str(new_val)
                }
        
        if changes:
            # Create AuditLog entry
            # Note: We can't easily get the current user here without middleware or passing it in
            # For now, we'll mark it as a system action or handle user in the view
            AuditLog.objects.create(
                action="UPDATE",
                content_type=ContentType.objects.get_for_model(Ticket),
                object_id=instance.id,
                details={'changes': changes}
            )

@receiver(post_save, sender=Ticket)
def log_ticket_creation(sender, instance, created, **kwargs):
    if created:
        AuditLog.objects.create(
            action="CREATE",
            content_type=ContentType.objects.get_for_model(Ticket),
            object_id=instance.id,
            details={'message': f"Ticket {instance.ticket_number} created"}
        )
