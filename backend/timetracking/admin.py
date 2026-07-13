from django.contrib import admin
from .models import TimeEntry, WorkSchedule, ResourceHoliday

admin.site.register(TimeEntry)
admin.site.register(WorkSchedule)
admin.site.register(ResourceHoliday)
