from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.models.medical_models import PatientMedicalProfile
from app.schemas.medical import MedicalProfileRead, MedicalProfileUpdate

router = APIRouter()

@router.get("", response_model=MedicalProfileRead)
def get_medical_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(PatientMedicalProfile).filter(PatientMedicalProfile.user_id == current_user.user_id).first()
    if not profile:
        # Create an empty one lazily
        profile = PatientMedicalProfile(user_id=current_user.user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("", response_model=MedicalProfileRead)
def update_medical_profile(
    profile_in: MedicalProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(PatientMedicalProfile).filter(PatientMedicalProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = PatientMedicalProfile(user_id=current_user.user_id)
        db.add(profile)
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    # Simple completeness check
    fields = ['date_of_birth', 'sex', 'height_cm', 'weight_kg', 'dietary_preference', 'dietary_restrictions']
    filled = sum(1 for f in fields if getattr(profile, f))
    profile.profile_completeness = round((filled / len(fields)) * 100, 1)
    
    db.commit()
    db.refresh(profile)
    return profile
