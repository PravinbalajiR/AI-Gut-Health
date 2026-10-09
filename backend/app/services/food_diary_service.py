from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.food_diary_models import FoodDiaryEntry, DailyNutritionSummary
from app.schemas.food_diary import FoodDiaryEntryCreate, FoodDiaryEntryUpdate
from datetime import date
from typing import List

def recalculate_daily_summary(db: Session, user_id: int, summary_date: date) -> DailyNutritionSummary:
    """Recalculates the daily nutrition totals based on food entries."""
    entries = db.query(FoodDiaryEntry).filter(
        FoodDiaryEntry.user_id == user_id,
        FoodDiaryEntry.consumption_date == summary_date
    ).all()
    
    summary = db.query(DailyNutritionSummary).filter(
        DailyNutritionSummary.user_id == user_id,
        DailyNutritionSummary.summary_date == summary_date
    ).first()
    
    if not summary:
        summary = DailyNutritionSummary(user_id=user_id, summary_date=summary_date)
        db.add(summary)
    
    summary.total_calories = sum((e.calories or 0) for e in entries)
    summary.total_protein = sum((e.protein or 0) for e in entries)
    summary.total_fat = sum((e.fat or 0) for e in entries)
    summary.total_carbs = sum((e.carbohydrates or 0) for e in entries)
    summary.total_fiber = sum((e.fiber or 0) for e in entries)
    summary.total_sugar = sum((e.sugar or 0) for e in entries)
    
    db.commit()
    db.refresh(summary)
    return summary

def create_food_entry(db: Session, user_id: int, entry_in: FoodDiaryEntryCreate) -> FoodDiaryEntry:
    db_entry = FoodDiaryEntry(**entry_in.model_dump(), user_id=user_id)
    # Basic estimation fallback if missing
    if db_entry.calories is None:
        db_entry.is_estimated = True
        
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Recalculate summary
    recalculate_daily_summary(db, user_id, db_entry.consumption_date)
    return db_entry

def delete_food_entry(db: Session, user_id: int, entry_id: int) -> bool:
    entry = db.query(FoodDiaryEntry).filter(FoodDiaryEntry.entry_id == entry_id, FoodDiaryEntry.user_id == user_id).first()
    if not entry:
        return False
        
    consumption_date = entry.consumption_date
    db.delete(entry)
    db.commit()
    
    recalculate_daily_summary(db, user_id, consumption_date)
    return True
