import os
from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import (
    EventType,
    Booking,
    BookingQuestionAnswer,
    BookingHistory,
    MeetingLink,
    EventTypeQuestion,
)
from app.services.slot_service import is_slot_available, generate_slots
from app.services.token_service import generate_token
from app.services import email_service

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def get_meeting_url(booking_id: UUID) -> str:
    return f"https://meet.google.com/{str(booking_id).replace('-', '')[:12]}"


def validate_required_answers(db: Session, event_type_id: UUID, answers: list) -> None:
    required_questions = db.query(EventTypeQuestion).filter(
        EventTypeQuestion.event_type_id == event_type_id,
        EventTypeQuestion.is_required == True,
    ).all()
    answered_ids = set()
    for a in answers:
        qid = a.question_id if hasattr(a, "question_id") else a.get("question_id")
        text = a.answer_text if hasattr(a, "answer_text") else a.get("answer_text")
        if qid and text:
            answered_ids.add(qid)
    for q in required_questions:
        if q.id not in answered_ids:
            raise HTTPException(status_code=400, detail=f"Required question not answered: {q.question_text}")


def create_booking(
    db: Session,
    event_type: EventType,
    invitee_name: str,
    invitee_email: str,
    start_time: datetime,
    end_time: datetime,
    tz_str: str,
    answers: list,
    rescheduled_from: UUID | None = None,
) -> Booking:
    if not is_slot_available(db, event_type, start_time, end_time):
        raise HTTPException(status_code=409, detail="Selected slot is no longer available")

    validate_required_answers(db, event_type.id, answers)

    cancel_token = generate_token()
    reschedule_token = generate_token()

    booking = Booking(
        event_type_id=event_type.id,
        user_id=event_type.user_id,
        invitee_name=invitee_name,
        invitee_email=invitee_email,
        start_time=start_time,
        end_time=end_time,
        timezone=tz_str,
        status="scheduled",
        cancel_token=cancel_token,
        reschedule_token=reschedule_token,
        rescheduled_from_booking_id=rescheduled_from,
    )
    db.add(booking)
    db.flush()

    for ans in answers:
        qid = ans.question_id if hasattr(ans, "question_id") else ans.get("question_id")
        text = ans.answer_text if hasattr(ans, "answer_text") else ans.get("answer_text")
        if qid:
            db.add(BookingQuestionAnswer(
                booking_id=booking.id,
                question_id=qid,
                answer_text=text,
            ))

    db.add(BookingHistory(
        booking_id=booking.id,
        action="created",
        new_start_time=start_time,
        new_end_time=end_time,
    ))

    meeting_url = get_meeting_url(booking.id)
    db.add(MeetingLink(
        booking_id=booking.id,
        meeting_url=meeting_url,
        meeting_provider="google_meet",
    ))

    db.flush()
    send_booking_emails(db, booking, event_type, meeting_url)
    return booking


def send_booking_emails(db: Session, booking: Booking, event_type: EventType, meeting_url: str) -> None:
    cancel_url = f"{FRONTEND_URL}/cancel/{booking.cancel_token}"
    reschedule_url = f"{FRONTEND_URL}/reschedule/{booking.reschedule_token}"
    start_str = booking.start_time.isoformat()
    end_str = booking.end_time.isoformat()

    body = email_service.build_booking_confirmation_body(
        event_type.name,
        booking.invitee_name,
        start_str,
        end_str,
        meeting_url,
        cancel_url,
        reschedule_url,
    )
    email_service.create_and_send_notification(
        db,
        booking.id,
        booking.invitee_email,
        f"Booking Confirmed: {event_type.name}",
        body,
        "booking_confirmation",
    )


def cancel_booking(db: Session, booking: Booking, reason: str | None = None) -> Booking:
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
    if booking.status == "rescheduled":
        raise HTTPException(status_code=400, detail="Booking was already rescheduled")

    booking.status = "cancelled"
    booking.cancellation_reason = reason
    booking.cancelled_at = datetime.now(timezone.utc)

    db.add(BookingHistory(
        booking_id=booking.id,
        action="cancelled",
        old_start_time=booking.start_time,
        old_end_time=booking.end_time,
        note=reason,
    ))

    event_type = db.query(EventType).filter(EventType.id == booking.event_type_id).first()
    body = email_service.build_cancellation_body(
        event_type.name if event_type else "Meeting",
        booking.invitee_name,
        booking.start_time.isoformat(),
    )
    email_service.create_and_send_notification(
        db,
        booking.id,
        booking.invitee_email,
        f"Booking Cancelled: {event_type.name if event_type else 'Meeting'}",
        body,
        "booking_cancellation",
    )
    return booking


def reschedule_booking(
    db: Session,
    old_booking: Booking,
    new_start_time: datetime,
    tz_str: str,
) -> tuple[Booking, Booking]:
    if old_booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot reschedule a cancelled booking")
    if old_booking.status == "rescheduled":
        raise HTTPException(status_code=400, detail="Booking was already rescheduled")

    event_type = db.query(EventType).filter(EventType.id == old_booking.event_type_id).first()
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")

    duration = event_type.duration_minutes
    new_end_time = new_start_time + timedelta(minutes=duration)

    if not is_slot_available(db, event_type, new_start_time, new_end_time):
        raise HTTPException(status_code=409, detail="Selected slot is no longer available")

    old_start = old_booking.start_time
    old_end = old_booking.end_time

    old_booking.status = "rescheduled"
    db.flush()

    new_booking = create_booking(
        db,
        event_type,
        old_booking.invitee_name,
        old_booking.invitee_email,
        new_start_time,
        new_end_time,
        tz_str,
        [],
        rescheduled_from=old_booking.id,
    )

    db.add(BookingHistory(
        booking_id=old_booking.id,
        action="rescheduled",
        old_start_time=old_start,
        old_end_time=old_end,
        new_start_time=new_start_time,
        new_end_time=new_end_time,
        note="Rescheduled to new booking",
    ))

    meeting_url = get_meeting_url(new_booking.id)
    body = email_service.build_reschedule_body(
        event_type.name,
        new_booking.invitee_name,
        old_start.isoformat(),
        new_start_time.isoformat(),
        meeting_url,
    )
    email_service.create_and_send_notification(
        db,
        new_booking.id,
        new_booking.invitee_email,
        f"Booking Rescheduled: {event_type.name}",
        body,
        "booking_rescheduled",
    )

    return old_booking, new_booking
