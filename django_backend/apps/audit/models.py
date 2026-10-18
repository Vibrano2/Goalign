from django.db import models
from django.contrib.auth.models import User

class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=128)
    target_type = models.CharField(max_length=128)
    target_identifier = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    request_id = models.CharField(max_length=64, null=True, blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor} performed {self.action} on {self.target_type} ({self.target_identifier}) at {self.timestamp}"
