from django.contrib import admin
from .models import Notification, Announcement, ChatMessage

admin.site.register(Notification)
admin.site.register(Announcement)
admin.site.register(ChatMessage)
