from django.contrib import admin
from .models import AIPromptTemplate, AIRequestLog

admin.site.register(AIPromptTemplate)
admin.site.register(AIRequestLog)
