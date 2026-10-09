from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# Food Diary Entry Schemas
class FoodDiaryEntryBase(BaseModel):
    food_name: str
    meal_category: str = Field(..., description="Breakfast, Lunch, Snack, or Dinner")
    quantity_consumed: float
    serving_unit: str
    
    # Nutrition snapshot (optional during creation, calculated if missing)
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrates: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    
    consumption_date: date
    consumption_time: Optional[str] = None
    source_type: Optional[str] = "manual"
    notes: Optional[str] = None

class FoodDiaryEntryCreate(FoodDiaryEntryBase):
    pass

class FoodDiaryEntryUpdate(BaseModel):
    food_name: Optional[str] = None
    meal_category: Optional[str] = None
    quantity_consumed: Optional[float] = None
    serving_unit: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrates: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    consumption_time: Optional[str] = None
    notes: Optional[str] = None

class FoodDiaryEntryRead(FoodDiaryEntryBase):
    entry_id: int
    user_id: int
    product_id: Optional[int] = None
    is_estimated: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Daily Nutrition Summary Schemas
class DailyNutritionSummaryRead(BaseModel):
    summary_id: int
    user_id: int
    summary_date: date
    
    total_calories: float
    total_protein: float
    total_fat: float
    total_carbs: float
    total_fiber: float
    total_sugar: float
    
    water_intake_ml: int
    is_complete: bool
    last_calculated_at: datetime
    
    class Config:
        from_attributes = True

class DailyLogResponse(BaseModel):
    date: date
    summary: Optional[DailyNutritionSummaryRead] = None
    entries: List[FoodDiaryEntryRead] = []

class NLPEntryRequest(BaseModel):
    text: str
    date: date
    meal_category: Optional[str] = None
