from django.contrib import admin
from .models import Document, WikiPage, Folder, SavedView

admin.site.register(Document)
admin.site.register(WikiPage)
admin.site.register(Folder)
admin.site.register(SavedView)
