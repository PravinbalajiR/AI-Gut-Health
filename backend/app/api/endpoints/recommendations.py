from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.models.medical_models import ClinicalRecommendation
from app.schemas.recommendation import RecommendationRead
from app.services import recommendation_service

router = APIRouter()

@router.get("", response_model=List[RecommendationRead])
async def get_recommendations(
    force_refresh: bool = False,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    recs = db.query(ClinicalRecommendation).filter(ClinicalRecommendation.user_id == current_user.user_id).all()
    
    if not recs or force_refresh:
        recs = await recommendation_service.generate_clinical_recommendations(db, current_user)
        
    return recs
