from uuid import UUID
from datetime import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_default_user
from app.models import (
    AvailabilitySchedule,
    AvailabilityRule,
    AvailabilityDateOverride,
    AvailabilityOverrideSlot,
)
from app.schemas import (
    AvailabilityScheduleCreate,
    AvailabilityScheduleUpdate,
    AvailabilityScheduleListItem,
    AvailabilityScheduleDetail,
    AvailabilityRuleResponse,
    DateOverrideCreate,
    DateOverrideResponse,
    OverrideSlotResponse,
    ScheduleCreateResponse,
    OverrideCreateResponse,
    MessageResponse,
)
from app.services.slot_service import parse_time_str, format_time

router = APIRouter(prefix="/api/availability-schedules", tags=["availability"])


def rule_to_response(rule: AvailabilityRule) -> AvailabilityRuleResponse:
    return AvailabilityRuleResponse(
        id=rule.id,
        day_of_week=rule.day_of_week,
        start_time=format_time(rule.start_time),
        end_time=format_time(rule.end_time),
        is_active=rule.is_active,
    )


def override_to_response(override: AvailabilityDateOverride) -> DateOverrideResponse:
    return DateOverrideResponse(
        id=override.id,
        override_date=override.override_date,
        is_unavailable=override.is_unavailable,
        reason=override.reason,
        slots=[
            OverrideSlotResponse(
                start_time=format_time(s.start_time),
                end_time=format_time(s.end_time),
            )
            for s in override.slots
        ],
    )


def validate_rules(rules):
    for rule in rules:
        start = parse_time_str(rule.start_time)
        end = parse_time_str(rule.end_time)
        if start >= end:
            raise HTTPException(status_code=400, detail="start_time must be before end_time")


@router.post("", response_model=ScheduleCreateResponse)
def create_schedule(data: AvailabilityScheduleCreate, db: Session = Depends(get_db)):
    user = get_default_user(db)
    validate_rules(data.rules)

    if data.is_default:
        db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.user_id == user.id,
            AvailabilitySchedule.is_default == True,
        ).update({"is_default": False})

    schedule = AvailabilitySchedule(
        user_id=user.id,
        name=data.name,
        timezone=data.timezone,
        is_default=data.is_default,
    )
    db.add(schedule)
    db.flush()

    for rule_data in data.rules:
        db.add(AvailabilityRule(
            schedule_id=schedule.id,
            day_of_week=rule_data.day_of_week,
            start_time=parse_time_str(rule_data.start_time),
            end_time=parse_time_str(rule_data.end_time),
            is_active=rule_data.is_active,
        ))

    db.commit()
    db.refresh(schedule)
    return ScheduleCreateResponse(
        id=schedule.id,
        name=schedule.name,
        timezone=schedule.timezone,
        is_default=schedule.is_default,
        message="Availability schedule created successfully",
    )


@router.get("")
def list_schedules(db: Session = Depends(get_db)):
    user = get_default_user(db)
    schedules = db.query(AvailabilitySchedule).filter(
        AvailabilitySchedule.user_id == user.id
    ).all()
    return {
        "schedules": [
            AvailabilityScheduleListItem(
                id=s.id,
                name=s.name,
                timezone=s.timezone,
                is_default=s.is_default,
            )
            for s in schedules
        ]
    }


@router.get("/{schedule_id}", response_model=AvailabilityScheduleDetail)
def get_schedule(schedule_id: UUID, db: Session = Depends(get_db)):
    schedule = db.query(AvailabilitySchedule).filter(
        AvailabilitySchedule.id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return AvailabilityScheduleDetail(
        id=schedule.id,
        name=schedule.name,
        timezone=schedule.timezone,
        is_default=schedule.is_default,
        rules=[rule_to_response(r) for r in schedule.rules],
        overrides=[override_to_response(o) for o in schedule.overrides],
    )


@router.put("/{schedule_id}")
def update_schedule(
    schedule_id: UUID,
    data: AvailabilityScheduleUpdate,
    db: Session = Depends(get_db),
):
    schedule = db.query(AvailabilitySchedule).filter(
        AvailabilitySchedule.id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if data.is_default:
        db.query(AvailabilitySchedule).filter(
            AvailabilitySchedule.user_id == schedule.user_id,
            AvailabilitySchedule.is_default == True,
            AvailabilitySchedule.id != schedule_id,
        ).update({"is_default": False})

    if data.name is not None:
        schedule.name = data.name
    if data.timezone is not None:
        schedule.timezone = data.timezone
    if data.is_default is not None:
        schedule.is_default = data.is_default

    if data.rules is not None:
        validate_rules(data.rules)
        db.query(AvailabilityRule).filter(
            AvailabilityRule.schedule_id == schedule_id
        ).delete()
        for rule_data in data.rules:
            db.add(AvailabilityRule(
                schedule_id=schedule_id,
                day_of_week=rule_data.day_of_week,
                start_time=parse_time_str(rule_data.start_time),
                end_time=parse_time_str(rule_data.end_time),
                is_active=rule_data.is_active,
            ))

    db.commit()
    return {"id": schedule.id, "message": "Availability schedule updated successfully"}


@router.post("/{schedule_id}/overrides", response_model=OverrideCreateResponse)
def add_override(
    schedule_id: UUID,
    data: DateOverrideCreate,
    db: Session = Depends(get_db),
):
    schedule = db.query(AvailabilitySchedule).filter(
        AvailabilitySchedule.id == schedule_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    existing = db.query(AvailabilityDateOverride).filter(
        AvailabilityDateOverride.schedule_id == schedule_id,
        AvailabilityDateOverride.override_date == data.override_date,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Override already exists for this date")

    if not data.is_unavailable and data.slots:
        for slot in data.slots:
            start = parse_time_str(slot.start_time)
            end = parse_time_str(slot.end_time)
            if start >= end:
                raise HTTPException(status_code=400, detail="start_time must be before end_time")

    override = AvailabilityDateOverride(
        schedule_id=schedule_id,
        override_date=data.override_date,
        is_unavailable=data.is_unavailable,
        reason=data.reason,
    )
    db.add(override)
    db.flush()

    for slot in data.slots:
        db.add(AvailabilityOverrideSlot(
            override_id=override.id,
            start_time=parse_time_str(slot.start_time),
            end_time=parse_time_str(slot.end_time),
        ))

    db.commit()
    db.refresh(override)
    return OverrideCreateResponse(
        id=override.id,
        override_date=override.override_date,
        message="Date override added successfully",
    )


@router.delete("/{schedule_id}/overrides/{override_id}", response_model=MessageResponse)
def delete_override(
    schedule_id: UUID,
    override_id: UUID,
    db: Session = Depends(get_db),
):
    override = db.query(AvailabilityDateOverride).filter(
        AvailabilityDateOverride.id == override_id,
        AvailabilityDateOverride.schedule_id == schedule_id,
    ).first()
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")

    db.delete(override)
    db.commit()
    return MessageResponse(message="Date override deleted successfully")
