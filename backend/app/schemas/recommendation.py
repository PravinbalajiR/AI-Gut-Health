from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RecommendationRead(BaseModel):
    rec_id: int
    user_id: int
    recommendation_text: str
    reasoning: Optional[str] = None
    category: Optional[str] = None
    evidence_references: Optional[str] = None
    limitations: Optional[str] = None
    patient_data_used: Optional[str] = None
    is_urgent: Optional[int] = 0
    generated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
