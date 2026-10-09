from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SymptomEntryBase(BaseModel):
    entry_date: str # YYYY-MM-DD
    entry_time: Optional[str] = None
    bloating: Optional[int] = 0
    abdominal_pain: Optional[int] = 0
    gas: Optional[int] = 0
    constipation: Optional[int] = 0
    diarrhea: Optional[int] = 0
    nausea: Optional[int] = 0
    heartburn: Optional[int] = 0
    bowel_frequency: Optional[int] = None
    stool_type: Optional[str] = None
    severity_overall: Optional[int] = 0
    meals_noted: Optional[str] = None
    stress_level: Optional[int] = None
    sleep_hours: Optional[float] = None
    hydration_glasses: Optional[int] = None
    notes: Optional[str] = None

class SymptomEntryCreate(SymptomEntryBase):
    pass

class SymptomEntryRead(SymptomEntryBase):
    symptom_id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
