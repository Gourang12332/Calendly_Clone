from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import EmailNotification
from app.schemas import EmailNotificationItem

router = APIRouter(prefix="/api/email-notifications", tags=["email"])


@router.get("")
def list_email_notifications(db: Session = Depends(get_db)):
    notifications = db.query(EmailNotification).order_by(
        EmailNotification.created_at.desc()
    ).all()
    return {
        "notifications": [
            EmailNotificationItem(
                id=n.id,
                booking_id=n.booking_id,
                recipient_email=n.recipient_email,
                subject=n.subject,
                notification_type=n.notification_type,
                status=n.status,
                sent_at=n.sent_at,
            )
            for n in notifications
        ]
    }
