import os
from datetime import datetime, time, timedelta, timezone
import pytz
from dotenv import load_dotenv
from app.database import engine, SessionLocal, Base
from app.models import (
    User,
    AvailabilitySchedule,
    AvailabilityRule,
    EventType,
    EventTypeQuestion,
    EventTypeQuestionOption,
    Booking,
    BookingHistory,
    MeetingLink,
    EmailNotification,
)
from app.services.token_service import generate_token

load_dotenv()


def parse_time(hour: int, minute: int = 0) -> time:
    return time(hour, minute)


def run_seed():
    if not engine:
        print("DATABASE_URL not set")
        return

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).first():
            print("Database already seeded")
            return

        user = User(
            name="Admin User",
            email="admin@calendlyclone.com",
            timezone="Asia/Kolkata",
        )
        db.add(user)
        db.flush()

        schedule = AvailabilitySchedule(
            user_id=user.id,
            name="Default Schedule",
            timezone="Asia/Kolkata",
            is_default=True,
        )
        db.add(schedule)
        db.flush()

        for dow in range(1, 6):
            db.add(AvailabilityRule(
                schedule_id=schedule.id,
                day_of_week=dow,
                start_time=parse_time(9),
                end_time=parse_time(17),
                is_active=True,
            ))

        et1 = EventType(
            user_id=user.id,
            schedule_id=schedule.id,
            name="30 Minute Meeting",
            slug="30-minute-meeting",
            description="Quick discussion call",
            duration_minutes=30,
            buffer_before_minutes=5,
            buffer_after_minutes=10,
            location_type="online",
        )
        db.add(et1)
        db.flush()

        et2 = EventType(
            user_id=user.id,
            schedule_id=schedule.id,
            name="Interview Call",
            slug="interview-call",
            description="Technical interview session",
            duration_minutes=45,
            buffer_before_minutes=10,
            buffer_after_minutes=10,
            location_type="online",
        )
        db.add(et2)
        db.flush()

        q1 = EventTypeQuestion(
            event_type_id=et1.id,
            question_text="What do you want to discuss?",
            question_type="textarea",
            is_required=True,
            display_order=1,
        )
        db.add(q1)
        db.flush()

        q2 = EventTypeQuestion(
            event_type_id=et1.id,
            question_text="Meeting purpose?",
            question_type="select",
            is_required=True,
            display_order=2,
        )
        db.add(q2)
        db.flush()

        db.add(EventTypeQuestionOption(
            question_id=q2.id,
            option_text="Project Discussion",
            display_order=1,
        ))
        db.add(EventTypeQuestionOption(
            question_id=q2.id,
            option_text="Interview",
            display_order=2,
        ))

        db.add(EventTypeQuestion(
            event_type_id=et2.id,
            question_text="What is your phone number?",
            question_type="phone",
            is_required=False,
            display_order=1,
        ))

        tz = pytz.timezone("Asia/Kolkata")
        now = datetime.now(tz)

        future_start = (now + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
        future_end = future_start + timedelta(minutes=30)

        booking1 = Booking(
            event_type_id=et1.id,
            user_id=user.id,
            invitee_name="Rahul Sharma",
            invitee_email="rahul@example.com",
            start_time=future_start,
            end_time=future_end,
            timezone="Asia/Kolkata",
            status="scheduled",
            cancel_token=generate_token(),
            reschedule_token=generate_token(),
        )
        db.add(booking1)
        db.flush()

        db.add(BookingHistory(
            booking_id=booking1.id,
            action="created",
            new_start_time=future_start,
            new_end_time=future_end,
        ))
        db.add(MeetingLink(
            booking_id=booking1.id,
            meeting_url=f"https://meet.google.com/{str(booking1.id).replace('-', '')[:12]}",
            meeting_provider="google_meet",
        ))
        db.add(EmailNotification(
            booking_id=booking1.id,
            recipient_email="rahul@example.com",
            subject="Booking Confirmed: 30 Minute Meeting",
            body="Your booking is confirmed.",
            notification_type="booking_confirmation",
            status="sent",
            sent_at=datetime.now(timezone.utc),
        ))

        past_start = (now - timedelta(days=5)).replace(hour=14, minute=0, second=0, microsecond=0)
        past_end = past_start + timedelta(minutes=45)

        booking2 = Booking(
            event_type_id=et2.id,
            user_id=user.id,
            invitee_name="Priya Patel",
            invitee_email="priya@example.com",
            start_time=past_start,
            end_time=past_end,
            timezone="Asia/Kolkata",
            status="scheduled",
            cancel_token=generate_token(),
            reschedule_token=generate_token(),
        )
        db.add(booking2)
        db.flush()

        db.add(BookingHistory(
            booking_id=booking2.id,
            action="created",
            new_start_time=past_start,
            new_end_time=past_end,
        ))
        db.add(MeetingLink(
            booking_id=booking2.id,
            meeting_url=f"https://meet.google.com/{str(booking2.id).replace('-', '')[:12]}",
            meeting_provider="google_meet",
        ))

        db.commit()
        print("Seed completed successfully")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
