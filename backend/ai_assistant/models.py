from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AIPromptTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    template_text = models.TextField(help_text="Use {{variable}} for dynamic content")
    description = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AIRequestLog(models.Model):
    REQUEST_TYPES = [
        ('SUMMARIZE', 'Summarize'),
        ('PRIORITIZE', 'Auto Prioritize'),
        ('SUGGEST', 'Task Suggestion'),
        ('RISK', 'Risk Analysis'),
        ('GENERATE', 'Content Generation'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    input_text = models.TextField()
    output_text = models.TextField()
    status = models.CharField(max_length=20, default='SUCCESS')
    tokens_used = models.IntegerField(default=0)
    processing_time_ms = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.request_type} by {self.user}"
