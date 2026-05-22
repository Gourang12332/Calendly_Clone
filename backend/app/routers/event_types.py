from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_default_user
from app.models import EventType, EventTypeQuestion
from app.schemas import (
    EventTypeCreate,
    EventTypeUpdate,
    EventTypeListItem,
    EventTypeDetail,
    EventTypeCreateResponse,
    QuestionResponse,
    QuestionOptionResponse,
    MessageResponse,
)

router = APIRouter(prefix="/api/event-types", tags=["event-types"])


def event_to_list_item(et: EventType) -> EventTypeListItem:
    return EventTypeListItem(
        id=et.id,
        name=et.name,
        slug=et.slug,
        duration_minutes=et.duration_minutes,
        public_url=f"/book/{et.slug}",
        is_active=et.is_active,
    )


def question_to_response(q: EventTypeQuestion) -> QuestionResponse:
    return QuestionResponse(
        id=q.id,
        question_text=q.question_text,
        question_type=q.question_type,
        is_required=q.is_required,
        display_order=q.display_order,
        options=[
            QuestionOptionResponse(
                id=o.id,
                option_text=o.option_text,
                display_order=o.display_order,
            )
            for o in sorted(q.options, key=lambda x: x.display_order)
        ],
    )


@router.post("", response_model=EventTypeCreateResponse)
def create_event_type(data: EventTypeCreate, db: Session = Depends(get_db)):
    user = get_default_user(db)
    existing = db.query(EventType).filter(EventType.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug must be unique")

    et = EventType(
        user_id=user.id,
        name=data.name,
        slug=data.slug,
        description=data.description,
        duration_minutes=data.duration_minutes,
        schedule_id=data.schedule_id,
        buffer_before_minutes=data.buffer_before_minutes,
        buffer_after_minutes=data.buffer_after_minutes,
        location_type=data.location_type,
    )
    db.add(et)
    db.commit()
    db.refresh(et)
    return EventTypeCreateResponse(
        id=et.id,
        name=et.name,
        slug=et.slug,
        public_url=f"/book/{et.slug}",
        duration_minutes=et.duration_minutes,
        is_active=et.is_active,
        message="Event type created successfully",
    )


@router.get("")
def list_event_types(db: Session = Depends(get_db)):
    user = get_default_user(db)
    items = db.query(EventType).filter(EventType.user_id == user.id).all()
    return {"event_types": [event_to_list_item(et) for et in items]}


@router.get("/{event_type_id}", response_model=EventTypeDetail)
def get_event_type(event_type_id: UUID, db: Session = Depends(get_db)):
    et = db.query(EventType).filter(EventType.id == event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    questions = sorted(et.questions, key=lambda q: q.display_order)
    return EventTypeDetail(
        id=et.id,
        name=et.name,
        slug=et.slug,
        description=et.description,
        duration_minutes=et.duration_minutes,
        schedule_id=et.schedule_id,
        buffer_before_minutes=et.buffer_before_minutes,
        buffer_after_minutes=et.buffer_after_minutes,
        location_type=et.location_type,
        is_active=et.is_active,
        questions=[question_to_response(q) for q in questions],
    )


@router.put("/{event_type_id}")
def update_event_type(
    event_type_id: UUID,
    data: EventTypeUpdate,
    db: Session = Depends(get_db),
):
    et = db.query(EventType).filter(EventType.id == event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    if data.slug and data.slug != et.slug:
        existing = db.query(EventType).filter(EventType.slug == data.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug must be unique")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(et, key, value)

    db.commit()
    db.refresh(et)
    return {"id": et.id, "message": "Event type updated successfully"}


@router.delete("/{event_type_id}", response_model=MessageResponse)
def delete_event_type(event_type_id: UUID, db: Session = Depends(get_db)):
    et = db.query(EventType).filter(EventType.id == event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    db.delete(et)
    db.commit()
    return MessageResponse(message="Event type deleted successfully")
