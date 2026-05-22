from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import User


def get_default_user(db: Session) -> User:
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=500, detail="No default user found. Run seed script.")
    return user
