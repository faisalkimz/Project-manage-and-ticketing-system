from django.apps import AppConfig


class AutomationConfig(AppConfig):
    name = 'automation'

    def ready(self):
        import automation.signals  # noqa: F401 — registers signal handlers
