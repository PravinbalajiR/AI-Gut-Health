from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.models.medical_models import SymptomEntry
from app.schemas.symptom import SymptomEntryRead, SymptomEntryCreate
from typing import List
from datetime import datetime, timezone

router = APIRouter()

@router.post("", response_model=SymptomEntryRead)
def create_symptom(
    symptom_in: SymptomEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if entry exists for this date
    existing = db.query(SymptomEntry).filter(
        SymptomEntry.user_id == current_user.user_id,
        SymptomEntry.entry_date == symptom_in.entry_date
    ).first()
    
    if existing:
        for k, v in symptom_in.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
        
    new_entry = SymptomEntry(user_id=current_user.user_id, **symptom_in.model_dump())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.get("", response_model=List[SymptomEntryRead])
def get_symptoms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SymptomEntry).filter(SymptomEntry.user_id == current_user.user_id).order_by(SymptomEntry.entry_date.desc()).limit(30).all()
