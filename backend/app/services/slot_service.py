from datetime import datetime, date, time, timedelta
from typing import List, Tuple
from uuid import UUID
import pytz
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import (
    EventType,
    AvailabilitySchedule,
    AvailabilityRule,
    AvailabilityDateOverride,
    AvailabilityOverrideSlot,
    Booking,
)


def parse_time_str(time_str: str) -> time:
    parts = time_str.split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    return time(hour, minute)


def format_time(t: time) -> str:
    return t.strftime("%H:%M")


def get_schedule_for_event(db: Session, event_type: EventType) -> AvailabilitySchedule | None:
    if event_type.schedule_id:
        return db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.id == event_type.schedule_id
        ).first()
    schedule = db.query(AvailabilitySchedule).filter(
        AvailabilitySchedule.user_id == event_type.user_id,
        AvailabilitySchedule.is_default == True,
    ).first()
    if not schedule:
        schedule = db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.user_id == event_type.user_id
        ).first()
    return schedule


def get_windows_for_date(
    db: Session,
    schedule: AvailabilitySchedule,
    target_date: date,
) -> List[Tuple[time, time]]:
    override = db.query(AvailabilityDateOverride).filter(
        AvailabilityDateOverride.schedule_id == schedule.id,
        AvailabilityDateOverride.override_date == target_date,
    ).first()

    if override:
        if override.is_unavailable:
            return []
        if override.slots:
            return [(s.start_time, s.end_time) for s in override.slots]
        return []

    day_of_week = target_date.weekday()
    python_dow = (day_of_week + 1) % 7

    rules = db.query(AvailabilityRule).filter(
        AvailabilityRule.schedule_id == schedule.id,
        AvailabilityRule.day_of_week == python_dow,
        AvailabilityRule.is_active == True,
    ).all()

    windows = []
    for rule in rules:
        if rule.start_time < rule.end_time:
            windows.append((rule.start_time, rule.end_time))
    return windows


def get_active_bookings_for_date(
    db: Session,
    event_type_id: UUID,
    target_date: date,
    tz: pytz.BaseTzInfo,
) -> List[Booking]:
    day_start = tz.localize(datetime.combine(target_date, time.min))
    day_end = tz.localize(datetime.combine(target_date, time.max))
    return db.query(Booking).filter(
        Booking.event_type_id == event_type_id,
        Booking.status == "scheduled",
        Booking.start_time < day_end,
        Booking.end_time > day_start,
    ).all()


def slot_conflicts_with_booking(
    slot_start: datetime,
    slot_end: datetime,
    booking: Booking,
    buffer_before: int,
    buffer_after: int,
) -> bool:
    blocked_start = booking.start_time - timedelta(minutes=buffer_before)
    blocked_end = booking.end_time + timedelta(minutes=buffer_after)
    return slot_start < blocked_end and slot_end > blocked_start


def generate_slots(
    db: Session,
    event_type: EventType,
    target_date: date,
) -> List[dict]:
    schedule = get_schedule_for_event(db, event_type)
    if not schedule:
        return []

    tz = pytz.timezone(schedule.timezone)
    windows = get_windows_for_date(db, schedule, target_date)
    if not windows:
        return []

    duration = event_type.duration_minutes
    buffer_before = event_type.buffer_before_minutes or 0
    buffer_after = event_type.buffer_after_minutes or 0

    bookings = get_active_bookings_for_date(db, event_type.id, target_date, tz)
    now = datetime.now(tz)
    slots = []

    for window_start, window_end in windows:
        current = datetime.combine(target_date, window_start)
        current = tz.localize(current)
        window_end_dt = tz.localize(datetime.combine(target_date, window_end))

        while current + timedelta(minutes=duration) <= window_end_dt:
            slot_end = current + timedelta(minutes=duration)
            available = True

            if current <= now:
                available = False

            for booking in bookings:
                if slot_conflicts_with_booking(
                    current, slot_end, booking, buffer_before, buffer_after
                ):
                    available = False
                    break

            if available:
                slots.append({
                    "start_time": current,
                    "end_time": slot_end,
                    "available": True,
                })

            current += timedelta(minutes=duration)

    return slots


def is_slot_available(
    db: Session,
    event_type: EventType,
    start_time: datetime,
    end_time: datetime,
) -> bool:
    if start_time >= end_time:
        return False

    target_date = start_time.date()
    if hasattr(start_time, "tzinfo") and start_time.tzinfo:
        target_date = start_time.astimezone(
            pytz.timezone(get_schedule_for_event(db, event_type).timezone if get_schedule_for_event(db, event_type) else "UTC")
        ).date()

    slots = generate_slots(db, event_type, target_date)
    for slot in slots:
        s_start = slot["start_time"].astimezone(start_time.tzinfo) if start_time.tzinfo else slot["start_time"]
        s_end = slot["end_time"].astimezone(end_time.tzinfo) if end_time.tzinfo else slot["end_time"]
        if abs((s_start - start_time).total_seconds()) < 2 and abs((s_end - end_time).total_seconds()) < 2:
            return True
    return False
