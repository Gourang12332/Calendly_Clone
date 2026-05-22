from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import (
    Booking,
    BookingQuestionAnswer,
    Contact,
    EventTypeQuestion,
)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _extract_phone_from_answers(db: Session, booking_ids: List[UUID]) -> Dict[UUID, str]:
    if not booking_ids:
        return {}
    rows = (
        db.query(BookingQuestionAnswer, EventTypeQuestion)
        .join(EventTypeQuestion, BookingQuestionAnswer.question_id == EventTypeQuestion.id)
        .filter(
            BookingQuestionAnswer.booking_id.in_(booking_ids),
            EventTypeQuestion.question_type == "phone",
        )
        .all()
    )
    result: Dict[UUID, str] = {}
    for answer, _ in rows:
        if answer.answer_text and answer.booking_id not in result:
            result[answer.booking_id] = answer.answer_text.strip()
    return result


def _extract_company_from_answers(db: Session, booking_ids: List[UUID]) -> Dict[UUID, str]:
    if not booking_ids:
        return {}
    rows = (
        db.query(BookingQuestionAnswer, EventTypeQuestion)
        .join(EventTypeQuestion, BookingQuestionAnswer.question_id == EventTypeQuestion.id)
        .filter(BookingQuestionAnswer.booking_id.in_(booking_ids))
        .all()
    )
    result: Dict[UUID, str] = {}
    for answer, question in rows:
        text = (question.question_text or "").lower()
        if "company" in text or "organization" in text:
            if answer.answer_text and answer.booking_id not in result:
                result[answer.booking_id] = answer.answer_text.strip()
    return result


def build_contacts_list(
    db: Session,
    user_id: UUID,
    filter_type: str = "all",
    search: str = "",
) -> List[dict]:
    now = datetime.now(timezone.utc)
    new_cutoff = now - timedelta(days=30)

    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.start_time.desc())
        .all()
    )

    manual_contacts = {
        _normalize_email(c.email): c
        for c in db.query(Contact).filter(Contact.user_id == user_id).all()
    }

    booking_ids = [b.id for b in bookings]
    phones_by_booking = _extract_phone_from_answers(db, booking_ids)
    companies_by_booking = _extract_company_from_answers(db, booking_ids)

    by_email: Dict[str, dict] = {}

    for booking in bookings:
        email_key = _normalize_email(booking.invitee_email)
        if email_key not in by_email:
            manual = manual_contacts.get(email_key)
            by_email[email_key] = {
                "id": str(manual.id) if manual else f"booking-{email_key}",
                "name": manual.name if manual else booking.invitee_name,
                "email": booking.invitee_email,
                "phone": manual.phone if manual else phones_by_booking.get(booking.id),
                "company": manual.company if manual else companies_by_booking.get(booking.id),
                "last_meeting_date": None,
                "next_meeting_date": None,
                "meeting_count": 0,
                "first_seen": booking.created_at,
                "source": "manual" if manual else "booking",
            }
        entry = by_email[email_key]
        entry["meeting_count"] += 1

        if booking.created_at and (
            entry.get("first_seen") is None or booking.created_at < entry["first_seen"]
        ):
            entry["first_seen"] = booking.created_at

        if booking.status == "cancelled":
            continue

        if booking.end_time < now:
            if entry["last_meeting_date"] is None or booking.end_time > entry["last_meeting_date"]:
                entry["last_meeting_date"] = booking.end_time
        elif booking.start_time > now and booking.status == "scheduled":
            if entry["next_meeting_date"] is None or booking.start_time < entry["next_meeting_date"]:
                entry["next_meeting_date"] = booking.start_time

        if not entry.get("phone") and phones_by_booking.get(booking.id):
            entry["phone"] = phones_by_booking[booking.id]
        if not entry.get("company") and companies_by_booking.get(booking.id):
            entry["company"] = companies_by_booking[booking.id]

    for email_key, manual in manual_contacts.items():
        if email_key not in by_email:
            by_email[email_key] = {
                "id": str(manual.id),
                "name": manual.name,
                "email": manual.email,
                "phone": manual.phone,
                "company": manual.company,
                "last_meeting_date": None,
                "next_meeting_date": None,
                "meeting_count": 0,
                "first_seen": manual.created_at,
                "source": "manual",
            }

    results = []
    for entry in by_email.values():
        first_seen = entry.get("first_seen")
        if first_seen:
            if first_seen.tzinfo is None:
                first_seen = first_seen.replace(tzinfo=timezone.utc)
            entry["is_new"] = first_seen >= new_cutoff
        else:
            entry["is_new"] = False
        del entry["first_seen"]

        if filter_type == "new" and not entry["is_new"]:
            continue
        if filter_type == "repeat" and entry["meeting_count"] < 2:
            continue

        if search:
            q = search.strip().lower()
            if q not in entry["name"].lower() and q not in entry["email"].lower():
                continue

        results.append(entry)

    results.sort(key=lambda c: c["name"].lower())
    return results
