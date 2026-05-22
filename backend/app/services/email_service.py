import os
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from app.models import EmailNotification

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587") or "587")
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD and SMTP_FROM)


def send_email(recipient: str, subject: str, body: str) -> tuple[bool, str | None]:
    if not smtp_configured():
        return True, None
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = recipient
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [recipient], msg.as_string())
        return True, None
    except Exception as e:
        return False, str(e)


def create_and_send_notification(
    db: Session,
    booking_id,
    recipient_email: str,
    subject: str,
    body: str,
    notification_type: str,
) -> EmailNotification:
    notification = EmailNotification(
        booking_id=booking_id,
        recipient_email=recipient_email,
        subject=subject,
        body=body,
        notification_type=notification_type,
        status="pending",
    )
    db.add(notification)
    db.flush()

    if smtp_configured():
        success, error = send_email(recipient_email, subject, body)
        if success:
            notification.status = "sent"
            notification.sent_at = datetime.now(timezone.utc)
        else:
            notification.status = "failed"
            notification.error_message = error
    else:
        notification.status = "sent"
        notification.sent_at = datetime.now(timezone.utc)

    db.flush()
    return notification


def build_booking_confirmation_body(
    event_name: str,
    invitee_name: str,
    start_time: str,
    end_time: str,
    meeting_url: str,
    cancel_url: str,
    reschedule_url: str,
) -> str:
    return (
        f"Hello {invitee_name},\n\n"
        f"Your booking for {event_name} is confirmed.\n\n"
        f"Time: {start_time} to {end_time}\n"
        f"Meeting link: {meeting_url}\n\n"
        f"Cancel: {cancel_url}\n"
        f"Reschedule: {reschedule_url}\n"
    )


def build_cancellation_body(event_name: str, invitee_name: str, start_time: str) -> str:
    return (
        f"Hello {invitee_name},\n\n"
        f"Your booking for {event_name} on {start_time} has been cancelled.\n"
    )


def build_reschedule_body(
    event_name: str,
    invitee_name: str,
    old_start: str,
    new_start: str,
    meeting_url: str,
) -> str:
    return (
        f"Hello {invitee_name},\n\n"
        f"Your booking for {event_name} has been rescheduled.\n"
        f"Previous time: {old_start}\n"
        f"New time: {new_start}\n"
        f"Meeting link: {meeting_url}\n"
    )
