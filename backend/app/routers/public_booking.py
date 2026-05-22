from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import EventType, Booking, MeetingLink
from app.schemas import (
    PublicEventTypeResponse,
    SlotsListResponse,
    SlotResponse,
    PublicBookingCreate,
    PublicBookingResponse,
    BookingConfirmationResponse,
    TokenBookingResponse,
    PublicCancelRequest,
    PublicRescheduleRequest,
    CancelResponse,
    RescheduleResponse,
)
from app.routers.event_types import question_to_response
from app.services.slot_service import generate_slots, get_schedule_for_event
from app.services import booking_service

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/event-types/{slug}", response_model=PublicEventTypeResponse)
def get_public_event_type(slug: str, db: Session = Depends(get_db)):
    et = db.query(EventType).filter(
        EventType.slug == slug,
        EventType.is_active == True,
    ).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    schedule = get_schedule_for_event(db, et)
    tz = schedule.timezone if schedule else "Asia/Kolkata"
    questions = sorted(et.questions, key=lambda q: q.display_order)

    return PublicEventTypeResponse(
        id=et.id,
        name=et.name,
        slug=et.slug,
        description=et.description,
        duration_minutes=et.duration_minutes,
        location_type=et.location_type,
        timezone=tz,
        questions=[question_to_response(q) for q in questions],
    )


@router.get("/event-types/{slug}/slots", response_model=SlotsListResponse)
def get_slots(slug: str, date: date, db: Session = Depends(get_db)):
    et = db.query(EventType).filter(
        EventType.slug == slug,
        EventType.is_active == True,
    ).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    schedule = get_schedule_for_event(db, et)
    tz = schedule.timezone if schedule else "Asia/Kolkata"
    slots = generate_slots(db, et, date)

    return SlotsListResponse(
        date=str(date),
        timezone=tz,
        slots=[
            SlotResponse(
                start_time=s["start_time"],
                end_time=s["end_time"],
                available=s["available"],
            )
            for s in slots
        ],
    )


@router.post("/bookings", response_model=PublicBookingResponse)
def create_public_booking(data: PublicBookingCreate, db: Session = Depends(get_db)):
    et = db.query(EventType).filter(
        EventType.id == data.event_type_id,
        EventType.is_active == True,
    ).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    from datetime import timedelta
    end_time = data.start_time + timedelta(minutes=et.duration_minutes)

    booking = booking_service.create_booking(
        db,
        et,
        data.invitee_name,
        data.invitee_email,
        data.start_time,
        end_time,
        data.timezone,
        data.answers,
    )
    db.commit()
    db.refresh(booking)

    meeting = db.query(MeetingLink).filter(MeetingLink.booking_id == booking.id).first()
    meeting_url = meeting.meeting_url if meeting else None

    return PublicBookingResponse(
        id=booking.id,
        status=booking.status,
        event_name=et.name,
        invitee_name=booking.invitee_name,
        invitee_email=booking.invitee_email,
        start_time=booking.start_time,
        end_time=booking.end_time,
        meeting_url=meeting_url,
        cancel_url=f"/cancel/{booking.cancel_token}",
        reschedule_url=f"/reschedule/{booking.reschedule_token}",
        message="Booking confirmed successfully",
    )


@router.get("/bookings/{booking_id}", response_model=BookingConfirmationResponse)
def get_booking(booking_id: UUID, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    et = booking.event_type
    meeting = db.query(MeetingLink).filter(MeetingLink.booking_id == booking.id).first()

    return BookingConfirmationResponse(
        id=booking.id,
        status=booking.status,
        event_name=et.name if et else "Meeting",
        invitee_name=booking.invitee_name,
        invitee_email=booking.invitee_email,
        start_time=booking.start_time,
        end_time=booking.end_time,
        timezone=booking.timezone,
        meeting_url=meeting.meeting_url if meeting else None,
    )


@router.get("/bookings/token/{token}", response_model=TokenBookingResponse)
def get_booking_by_token(token: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(
        (Booking.cancel_token == token) | (Booking.reschedule_token == token)
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid token")

    et = booking.event_type
    meeting = db.query(MeetingLink).filter(MeetingLink.booking_id == booking.id).first()

    return TokenBookingResponse(
        id=booking.id,
        status=booking.status,
        event_name=et.name if et else "Meeting",
        event_slug=et.slug if et else "",
        invitee_name=booking.invitee_name,
        invitee_email=booking.invitee_email,
        start_time=booking.start_time,
        end_time=booking.end_time,
        timezone=booking.timezone,
        meeting_url=meeting.meeting_url if meeting else None,
        event_type_id=booking.event_type_id,
        duration_minutes=et.duration_minutes if et else 30,
    )


@router.post("/bookings/cancel/{cancel_token}", response_model=CancelResponse)
def cancel_by_token(
    cancel_token: str,
    data: PublicCancelRequest | None = None,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.cancel_token == cancel_token).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid cancel token")

    reason = data.reason if data and data.reason else None
    booking_service.cancel_booking(db, booking, reason)
    db.commit()
    db.refresh(booking)

    return CancelResponse(
        id=booking.id,
        status=booking.status,
        cancelled_at=booking.cancelled_at,
        message="Meeting cancelled successfully",
    )


@router.post("/bookings/reschedule/{reschedule_token}", response_model=RescheduleResponse)
def reschedule_by_token(
    reschedule_token: str,
    data: PublicRescheduleRequest,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(
        Booking.reschedule_token == reschedule_token
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid reschedule token")

    old_booking, new_booking = booking_service.reschedule_booking(
        db, booking, data.new_start_time, data.timezone
    )
    db.commit()

    return RescheduleResponse(
        old_booking_id=old_booking.id,
        new_booking_id=new_booking.id,
        old_status=old_booking.status,
        new_status=new_booking.status,
        new_start_time=new_booking.start_time,
        message="Meeting rescheduled successfully",
    )
