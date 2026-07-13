from django.contrib import admin
from .models import WorkflowRule, Webhook, BackgroundJob

admin.site.register(WorkflowRule)
admin.site.register(Webhook)
admin.site.register(BackgroundJob)
