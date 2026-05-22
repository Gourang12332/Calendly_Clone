from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import EventType, EventTypeQuestion, EventTypeQuestionOption
from app.schemas import QuestionsBulkCreate, QuestionsBulkUpdate

router = APIRouter(prefix="/api/event-types", tags=["questions"])


@router.post("/{event_type_id}/questions")
def add_questions(
    event_type_id: UUID,
    data: QuestionsBulkCreate,
    db: Session = Depends(get_db),
):
    et = db.query(EventType).filter(EventType.id == event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    for q_data in data.questions:
        question = EventTypeQuestion(
            event_type_id=event_type_id,
            question_text=q_data.question_text,
            question_type=q_data.question_type,
            is_required=q_data.is_required,
            display_order=q_data.display_order,
        )
        db.add(question)
        db.flush()
        for opt in q_data.options:
            db.add(EventTypeQuestionOption(
                question_id=question.id,
                option_text=opt.option_text,
                display_order=opt.display_order,
            ))

    db.commit()
    return {"event_type_id": event_type_id, "message": "Questions added successfully"}


@router.put("/{event_type_id}/questions")
def update_questions(
    event_type_id: UUID,
    data: QuestionsBulkUpdate,
    db: Session = Depends(get_db),
):
    et = db.query(EventType).filter(EventType.id == event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")

    existing_ids = {q.id for q in et.questions}
    incoming_ids = {q.id for q in data.questions if q.id}

    for qid in existing_ids - incoming_ids:
        question = db.query(EventTypeQuestion).filter(EventTypeQuestion.id == qid).first()
        if question:
            db.delete(question)

    for q_data in data.questions:
        if q_data.id and q_data.id in existing_ids:
            question = db.query(EventTypeQuestion).filter(
                EventTypeQuestion.id == q_data.id
            ).first()
            if question:
                question.question_text = q_data.question_text
                question.question_type = q_data.question_type
                question.is_required = q_data.is_required
                question.display_order = q_data.display_order
                db.query(EventTypeQuestionOption).filter(
                    EventTypeQuestionOption.question_id == question.id
                ).delete()
                for opt in q_data.options:
                    db.add(EventTypeQuestionOption(
                        question_id=question.id,
                        option_text=opt.option_text,
                        display_order=opt.display_order,
                    ))
        else:
            question = EventTypeQuestion(
                event_type_id=event_type_id,
                question_text=q_data.question_text,
                question_type=q_data.question_type,
                is_required=q_data.is_required,
                display_order=q_data.display_order,
            )
            db.add(question)
            db.flush()
            for opt in q_data.options:
                db.add(EventTypeQuestionOption(
                    question_id=question.id,
                    option_text=opt.option_text,
                    display_order=opt.display_order,
                ))

    db.commit()
    return {"event_type_id": event_type_id, "message": "Questions updated successfully"}
