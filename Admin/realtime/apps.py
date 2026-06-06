from django.apps import AppConfig

class RealtimeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Admin.realtime'
    verbose_name = 'Real-time Features'

    def ready(self):
        import Admin.realtime.signals
