from django.contrib import admin
from .models import AuditLog, ComplianceReport

admin.site.register(AuditLog)
admin.site.register(ComplianceReport)
