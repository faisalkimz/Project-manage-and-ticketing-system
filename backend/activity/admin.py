from django.contrib import admin
from .models import AuditLog, Comment, Attachment

admin.site.register(AuditLog)
admin.site.register(Comment)
admin.site.register(Attachment)
