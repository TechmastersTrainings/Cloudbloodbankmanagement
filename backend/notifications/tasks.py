from celery import shared_task
from django.contrib.auth import get_user_model
from notifications.models import Notification
from notifications.services.email_service import send_email_notification
from notifications.services.sms_service import send_sms_notification

User = get_user_model()

@shared_task
def send_blood_request_notification(receiver_id, hospital_id, blood_group, quantity):
    try:
        receiver = User.objects.get(id=receiver_id)
        hospital = User.objects.get(id=hospital_id)
        subject = "🩸 New Blood Request Received"
        message = (
            f"Dear {hospital.full_name},\n\n"
            f"A blood request has been made by {receiver.full_name}.\n"
            f"Blood Group: {blood_group}\nQuantity: {quantity} units.\n\n"
            f"Please respond as soon as possible."
        )

        send_email_notification(subject, message, [hospital.email])
        send_sms_notification(hospital.phone, f"Blood Request: {blood_group}, Qty: {quantity}")

        Notification.objects.create(
            user=hospital,
            title="New Blood Request",
            message=message,
            notification_type="EMAIL"
        )
    except Exception as e:
        print(f"Error sending blood request notification: {e}")

@shared_task
def send_low_stock_alert(hospital_id, blood_group, quantity):
    try:
        hospital = User.objects.get(id=hospital_id)
        subject = "⚠️ Low Blood Stock Alert"
        message = f"Warning! Blood group {blood_group} has dropped to {quantity} units."

        send_email_notification(subject, message, [hospital.email])
        send_sms_notification(hospital.phone, f"Low Stock: {blood_group} ({quantity} units left)")

        Notification.objects.create(
            user=hospital,
            title="Low Stock Alert",
            message=message,
            notification_type="EMAIL"
        )
    except Exception as e:
        print(f"Error sending low stock alert: {e}")

@shared_task
def cleanup_old_notifications():
    from datetime import timedelta
    from django.utils import timezone
    cutoff = timezone.now() - timedelta(days=30)
    Notification.objects.filter(created_at__lt=cutoff).delete()
