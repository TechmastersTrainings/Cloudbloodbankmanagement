from django.core.mail import send_mail
from django.conf import settings
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

def send_email_notification(user, subject, message):
    """Send email using Django’s built-in SMTP + create notification log."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        Notification.objects.create(
            user=user,
            title=subject,
            message=message,
            notification_type='EMAIL'
        )
        logger.info(f"Email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {user.email}: {e}")
        return False
