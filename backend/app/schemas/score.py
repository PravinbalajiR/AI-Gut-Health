from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class GutScoreRead(BaseModel):
    score_id: int
    product_id: int
    fiber_score: float
    processing_score: float
    sugar_score: float
    additive_score: float
    final_gut_score: float
    calculated_at: datetime

    class Config:
        from_attributes = True

class FoodDiversityScoreRead(BaseModel):
    diversity_id: int
    user_id: int
    score: float
    calculated_date: date

    class Config:
        from_attributes = True
