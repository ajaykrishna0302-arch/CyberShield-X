import re
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SupportRequest, User
from app.routes.auth import require_roles

router = APIRouter(prefix="/api/support", tags=["Support"])


class SupportSubmission(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    subject: str = Field(min_length=3, max_length=160)
    category: Literal["Technical Issue", "Account Problem", "Bug Report", "General Question", "Other"]
    message: str = Field(min_length=10, max_length=5000)

    @field_validator("name", "subject", "message", mode="before")
    @classmethod
    def trim_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value


@router.post("/requests", status_code=201)
def create_support_request(data: SupportSubmission, db: Session = Depends(get_db)):
    request = SupportRequest(**data.model_dump())
    try:
        db.add(request)
        db.commit()
        db.refresh(request)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save support request")
    return {"message": "Support request saved", "id": request.id}


@router.get("/admin/unread-count")
def unread_count(db: Session = Depends(get_db), _admin: User = Depends(require_roles("Admin"))):
    return {"count": db.query(SupportRequest).filter(SupportRequest.is_read == 0).count()}


@router.get("/admin/messages")
def list_support_messages(db: Session = Depends(get_db), _admin: User = Depends(require_roles("Admin"))):
    rows = db.query(SupportRequest).order_by(SupportRequest.created_at.desc(), SupportRequest.id.desc()).all()
    return [{"id": row.id, "name": row.name, "email": row.email, "subject": row.subject,
             "category": row.category, "message": row.message, "created_at": row.created_at,
             "is_read": bool(row.is_read)} for row in rows]


@router.get("/admin/messages/{message_id}")
def get_support_message(message_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_roles("Admin"))):
    row = db.query(SupportRequest).filter(SupportRequest.id == message_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Support message not found")
    return {"id": row.id, "name": row.name, "email": row.email, "subject": row.subject,
            "category": row.category, "message": row.message, "created_at": row.created_at,
            "is_read": bool(row.is_read)}


@router.patch("/admin/messages/{message_id}/read")
def mark_support_message_read(message_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_roles("Admin"))):
    row = db.query(SupportRequest).filter(SupportRequest.id == message_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Support message not found")
    row.is_read = 1
    db.commit()
    return {"id": row.id, "is_read": True}
