from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.models.models import User
from app.api.deps import get_current_user
from app.models.food_diary_models import FoodDiaryEntry, DailyNutritionSummary, FoodSymptomAssociation
from app.schemas.food_diary import FoodDiaryEntryCreate, FoodDiaryEntryRead, FoodDiaryEntryUpdate, DailyLogResponse, DailyNutritionSummaryRead
from app.services import food_diary_service

router = APIRouter()

@router.get("", response_model=DailyLogResponse)
def get_daily_log(
    target_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entries = db.query(FoodDiaryEntry).filter(
        FoodDiaryEntry.user_id == current_user.user_id,
        FoodDiaryEntry.consumption_date == target_date
    ).all()
    
    summary = db.query(DailyNutritionSummary).filter(
        DailyNutritionSummary.user_id == current_user.user_id,
        DailyNutritionSummary.summary_date == target_date
    ).first()
    
    return DailyLogResponse(
        date=target_date,
        summary=summary,
        entries=entries
    )

@router.post("", response_model=FoodDiaryEntryRead)
def add_food_entry(
    entry_in: FoodDiaryEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return food_diary_service.create_food_entry(db, current_user.user_id, entry_in)

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = food_diary_service.delete_food_entry(db, current_user.user_id, entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return

from app.schemas.food_diary import NLPEntryRequest
from app.services import food_nlp_service

@router.post("/parse", response_model=List[FoodDiaryEntryRead])
async def parse_natural_language_food(
    req: NLPEntryRequest,
    ai_consent: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        parsed_entries = await food_nlp_service.parse_food_text(req.text, req.date, ai_consent)
        saved_entries = []
        for entry in parsed_entries:
            if req.meal_category and entry.meal_category not in ["Breakfast", "Lunch", "Snack", "Dinner"]:
                entry.meal_category = req.meal_category
            saved = food_diary_service.create_food_entry(db, current_user.user_id, entry)
            saved_entries.append(saved)
        return saved_entries
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.services import correlation_service

@router.get("/insights")
async def get_food_symptom_insights(
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if force_refresh:
        await correlation_service.generate_correlation_insights(db, current_user.user_id)
        
    insights = db.query(FoodSymptomAssociation).filter(
        FoodSymptomAssociation.user_id == current_user.user_id
    ).all()
    
    return insights


