"""
Django signal handlers that wire WorkflowRules to real events on Task and Ticket.

Supported trigger types:
  - CREATED       — fired when a Task or Ticket is newly created
  - UPDATED       — fired on every save (excluding creation)
  - STATUS_CHANGE — fired when .status has changed value

The heavy lifting (condition evaluation + action dispatch) lives in utils.py
(evaluate_rules_for_object → execute_workflow_rule → execute_action).
Signals here are intentionally thin: capture old state, detect the trigger
type, delegate to utils.
"""
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver


# ---------------------------------------------------------------------------
# pre_save: snapshot old field values before the write happens
# ---------------------------------------------------------------------------

@receiver(pre_save)
def _capture_old_values(sender, instance, **kwargs):
    """Stash pre-save field values on the instance for STATUS_CHANGE detection."""
    if sender.__name__ not in ('Task', 'Ticket') or not instance.pk:
        return
    try:
        old = sender.objects.get(pk=instance.pk)
        instance._pre_save_status = old.status
        instance._pre_save_assigned = getattr(old, 'assigned_to_id', None)
    except sender.DoesNotExist:
        instance._pre_save_status = None
        instance._pre_save_assigned = None


# ---------------------------------------------------------------------------
# post_save: evaluate rules after the write has succeeded
# ---------------------------------------------------------------------------

@receiver(post_save)
def _trigger_automation_rules(sender, instance, created, **kwargs):
    """
    After saving a Task or Ticket, evaluate all active WorkflowRules
    whose target_content_type matches and whose trigger_type applies.
    """
    if sender.__name__ not in ('Task', 'Ticket'):
        return

    # Determine which trigger types apply to this save event
    applicable_triggers = set()

    if created:
        applicable_triggers.add('CREATED')
    else:
        applicable_triggers.add('UPDATED')

        # STATUS_CHANGE: only if status actually changed
        old_status = getattr(instance, '_pre_save_status', None)
        if old_status is not None and old_status != instance.status:
            applicable_triggers.add('STATUS_CHANGE')

    # Evaluate each applicable trigger — catch all exceptions so signals never
    # propagate errors back to the view that saved the object.
    for trigger_type in applicable_triggers:
        try:
            from .utils import evaluate_rules_for_object
            evaluate_rules_for_object(instance, trigger_type)
        except Exception as exc:
            # Log but do not re-raise — automations must not break core saves
            import logging
            logging.getLogger('automation').warning(
                'Automation signal error (sender=%s trigger=%s pk=%s): %s',
                sender.__name__, trigger_type, instance.pk, exc
            )
