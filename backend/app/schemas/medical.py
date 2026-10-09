from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Medical Profile ────────────────────────────────────────────────────────

class MedicalProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    dietary_preference: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    lifestyle_notes: Optional[str] = None
    gi_history_notes: Optional[str] = None
    family_history_notes: Optional[str] = None


class MedicalProfileRead(BaseModel):
    profile_id: int
    user_id: int
    date_of_birth: Optional[str] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    dietary_preference: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    lifestyle_notes: Optional[str] = None
    gi_history_notes: Optional[str] = None
    family_history_notes: Optional[str] = None
    profile_completeness: Optional[float] = 0.0
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Condition ────────────────────────────────────────────────────────────

class ConditionCreate(BaseModel):
    condition_name: str
    condition_type: Optional[str] = None
    onset_date: Optional[str] = None
    status: Optional[str] = "active"
    source_type: Optional[str] = "user_reported"
    notes: Optional[str] = None


class ConditionRead(ConditionCreate):
    condition_id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Allergy ──────────────────────────────────────────────────────────────

class AllergyCreate(BaseModel):
    allergen_name: str
    allergy_type: Optional[str] = "suspected"
    reaction_description: Optional[str] = None
    severity: Optional[str] = None
    source_type: Optional[str] = "user_reported"


class AllergyRead(AllergyCreate):
    allergy_id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Medication ───────────────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    medication_name: str
    medication_type: Optional[str] = "medication"
    dose: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gi_concern_notes: Optional[str] = None
    source_type: Optional[str] = "user_reported"
    is_active: Optional[int] = 1


class MedicationRead(MedicationCreate):
    medication_id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Lab Result ───────────────────────────────────────────────────────────

class LabResultRead(BaseModel):
    lab_id: int
    user_id: int
    test_name: str
    test_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    result_status: Optional[str] = None
    test_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Document ─────────────────────────────────────────────────────────────

class DocumentRead(BaseModel):
    document_id: int
    user_id: int
    original_filename: str
    file_type: str
    file_size_bytes: Optional[int] = None
    document_type: Optional[str] = None
    document_date: Optional[str] = None
    issuing_facility: Optional[str] = None
    issuing_clinician: Optional[str] = None
    processing_status: str
    processing_error: Optional[str] = None
    ai_consent_given: int
    uploaded_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Extraction ───────────────────────────────────────────────────────────

class ExtractionRead(BaseModel):
    extraction_id: int
    document_id: int
    field_type: str
    field_name: str
    extracted_value: str
    extracted_unit: Optional[str] = None
    reference_range: Optional[str] = None
    document_date: Optional[str] = None
    original_text: Optional[str] = None
    confidence_note: Optional[str] = None
    information_source: str
    review_status: str

    class Config:
        from_attributes = True


class ExtractionReview(BaseModel):
    extraction_id: int
    review_status: str  # confirmed|rejected|corrected
    user_correction: Optional[str] = None


class DocumentReviewRequest(BaseModel):
    extractions: List[ExtractionReview]
    save_to_profile: Optional[bool] = True
