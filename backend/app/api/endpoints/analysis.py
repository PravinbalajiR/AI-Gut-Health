from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.services import analysis_service

router = APIRouter()

@router.get("/weekly")
async def get_weekly_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a full weekly gut health analysis based on recent receipt data:
    - Nutrition totals for the week
    - Food categorisation (good/moderate/bad for gut)
    - Healthy alternatives
    - Recommended 7-day meal plan
    - Top gut health tips
    """
    return await analysis_service.generate_weekly_analysis(db, current_user)
