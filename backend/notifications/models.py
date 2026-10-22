from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

NOTIFICATION_TYPE = (
    ('EMAIL', 'Email'),
    ('SMS', 'SMS'),
    ('SYSTEM', 'System'),
)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE, default='SYSTEM')
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.title}"
