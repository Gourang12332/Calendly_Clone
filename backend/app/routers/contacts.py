from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_default_user
from app.models import Contact
from app.schemas import ContactCreate, ContactCreateResponse, ContactItem, MessageResponse
from app.services.contact_service import _normalize_email, build_contacts_list

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("")
def list_contacts(
    filter: str = Query("all", pattern="^(all|new|repeat)$"),
    search: str = Query(""),
    db: Session = Depends(get_db),
):
    user = get_default_user(db)
    items = build_contacts_list(db, user.id, filter_type=filter, search=search)
    return {
        "contacts": [ContactItem(**item) for item in items],
        "total": len(items),
    }


@router.post("", response_model=ContactCreateResponse)
def create_contact(data: ContactCreate, db: Session = Depends(get_db)):
    user = get_default_user(db)
    email_key = _normalize_email(data.email)

    existing = db.query(Contact).filter(
        Contact.user_id == user.id,
        func.lower(Contact.email) == email_key,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Contact with this email already exists")

    contact = Contact(
        user_id=user.id,
        name=data.name.strip(),
        email=data.email.strip(),
        phone=data.phone.strip() if data.phone else None,
        company=data.company.strip() if data.company else None,
        source="manual",
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    return ContactCreateResponse(
        id=contact.id,
        message="Contact added successfully",
    )


@router.delete("/{contact_id}", response_model=MessageResponse)
def delete_contact(contact_id: UUID, db: Session = Depends(get_db)):
    user = get_default_user(db)
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == user.id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()
    return MessageResponse(message="Contact deleted successfully")
