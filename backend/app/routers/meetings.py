from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_default_user
from app.models import Booking, EventType
from app.schemas import (
    MeetingItem,
    CancelMeetingRequest,
    RescheduleMeetingRequest,
    CancelResponse,
    RescheduleResponse,
)
from app.services import booking_service

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


@router.get("")
def list_meetings(
    type: str = Query(..., pattern="^(upcoming|past)$"),
    db: Session = Depends(get_db),
):
    user = get_default_user(db)
    now = datetime.now(timezone.utc)

    query = db.query(Booking).filter(Booking.user_id == user.id)

    if type == "upcoming":
        bookings = query.filter(
            Booking.start_time > now,
            Booking.status == "scheduled",
        ).order_by(Booking.start_time.asc()).all()
    else:
        bookings = query.filter(
            Booking.end_time < now,
        ).order_by(Booking.start_time.desc()).all()

    meetings = []
    for b in bookings:
        et = db.query(EventType).filter(EventType.id == b.event_type_id).first()
        status = b.status
        if type == "past" and status == "scheduled":
            status = "completed"
        meetings.append(MeetingItem(
            id=b.id,
            event_name=et.name if et else "Meeting",
            invitee_name=b.invitee_name,
            invitee_email=b.invitee_email,
            start_time=b.start_time,
            end_time=b.end_time,
            status=status,
        ))

    return {"meetings": meetings}


@router.post("/{booking_id}/cancel", response_model=CancelResponse)
def cancel_meeting(
    booking_id: UUID,
    data: CancelMeetingRequest,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking_service.cancel_booking(db, booking, data.reason)
    db.commit()
    db.refresh(booking)

    return CancelResponse(
        id=booking.id,
        status=booking.status,
        cancelled_at=booking.cancelled_at,
        message="Meeting cancelled successfully",
    )


@router.post("/{booking_id}/reschedule", response_model=RescheduleResponse)
def reschedule_meeting(
    booking_id: UUID,
    data: RescheduleMeetingRequest,
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

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
