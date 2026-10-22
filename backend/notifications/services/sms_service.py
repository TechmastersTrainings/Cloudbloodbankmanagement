import logging
logger = logging.getLogger(__name__)

def send_sms_notification(phone_number, message):
    """Disabled in this version (no SMS gateway configured)."""
    logger.info(f"SMS not sent (disabled). Would send to {phone_number}: {message}")
    return True
