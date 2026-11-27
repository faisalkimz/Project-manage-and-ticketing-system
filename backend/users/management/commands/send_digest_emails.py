from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from users.models import User
from collaboration.models import Notification


class Command(BaseCommand):
    help = 'Send daily digest emails of unread notifications to users who enabled digest_enabled.'

    def handle(self, *args, **options):
        since = timezone.now() - timedelta(hours=24)
        users = User.objects.filter(is_active=True, digest_enabled=True)
        sent_count = 0
        for user in users:
            if not user.email:
                continue
            notifs = Notification.objects.filter(user=user, is_read=False, created_at__gte=since)
            if not notifs.exists():
                continue
            lines = [f"- {n.verb}: {n.description or ''}".strip() for n in notifs[:20]]
            body = (
                f"Hi {user.first_name or user.username},\n\n"
                f"Here is your Omni-PMS daily digest ({notifs.count()} unread notifications):\n\n"
                + "\n".join(lines)
                + "\n\nLog in to view all updates."
            )
            send_mail(
                subject=f"Omni-PMS Daily Digest ({notifs.count()} unread)",
                message=body,
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
            sent_count += 1
        self.stdout.write(self.style.SUCCESS(f"Sent {sent_count} digest email(s)."))
