from django.contrib import admin
from .models import ActivityAlert, NotificationRule, EmailAlert, PushNotification, ReminderNotification, DeadlineAlert, SLABreachAlert, UserDeviceToken

admin.site.register(ActivityAlert)
admin.site.register(NotificationRule)
admin.site.register(EmailAlert)
admin.site.register(PushNotification)
admin.site.register(ReminderNotification)
admin.site.register(DeadlineAlert)
admin.site.register(SLABreachAlert)
admin.site.register(UserDeviceToken)
