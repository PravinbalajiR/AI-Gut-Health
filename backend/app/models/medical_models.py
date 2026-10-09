from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class PatientMedicalProfile(Base):
    __tablename__ = "patient_medical_profiles"

    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True)
    date_of_birth = Column(String, nullable=True)
    sex = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    dietary_preference = Column(String, nullable=True)
    dietary_restrictions = Column(Text, nullable=True)
    lifestyle_notes = Column(Text, nullable=True)
    gi_history_notes = Column(Text, nullable=True)
    family_history_notes = Column(Text, nullable=True)
    profile_completeness = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="medical_profile")
    conditions = relationship("PatientCondition", back_populates="profile_user", foreign_keys="PatientCondition.user_id", primaryjoin="PatientMedicalProfile.user_id == PatientCondition.user_id")
    allergies = relationship("PatientAllergy", back_populates="profile_user", foreign_keys="PatientAllergy.user_id", primaryjoin="PatientMedicalProfile.user_id == PatientAllergy.user_id")
    medications = relationship("PatientMedication", back_populates="profile_user", foreign_keys="PatientMedication.user_id", primaryjoin="PatientMedicalProfile.user_id == PatientMedication.user_id")


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    document_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    original_filename = Column(String)
    file_type = Column(String)
    file_size_bytes = Column(Integer)
    storage_path = Column(String)
    document_type = Column(String, nullable=True)   # e.g. blood_test, endoscopy_report
    document_date = Column(String, nullable=True)
    issuing_facility = Column(String, nullable=True)
    issuing_clinician = Column(String, nullable=True)
    processing_status = Column(String, default='pending')  # pending|processing|complete|failed|needs_review
    processing_error = Column(Text, nullable=True)
    raw_extracted_text = Column(Text, nullable=True)
    ai_consent_given = Column(Integer, default=0)   # 0=no, 1=yes
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="medical_documents")
    extractions = relationship("MedicalRecordExtraction", back_populates="document", cascade="all, delete-orphan")


class MedicalRecordExtraction(Base):
    __tablename__ = "medical_record_extractions"

    extraction_id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.document_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    field_type = Column(String)   # diagnosis|lab_result|medication|allergy|finding|recommendation
    field_name = Column(String)
    extracted_value = Column(Text)
    extracted_unit = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    document_date = Column(String, nullable=True)
    original_text = Column(Text, nullable=True)
    confidence_note = Column(String, nullable=True)   # high|medium|low|uncertain
    information_source = Column(String, default='document')  # document|user_reported|ai_generated
    review_status = Column(String, default='pending')   # pending|confirmed|rejected|corrected
    user_correction = Column(Text, nullable=True)
    extracted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)

    document = relationship("MedicalDocument", back_populates="extractions")
    user = relationship("User")


class PatientCondition(Base):
    __tablename__ = "patient_conditions"

    condition_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    condition_name = Column(String)
    condition_type = Column(String, nullable=True)   # e.g. GI, autoimmune, metabolic
    onset_date = Column(String, nullable=True)
    status = Column(String, default='active')   # active|resolved|unknown
    source_type = Column(String, default='user_reported')  # user_reported|document|clinician
    source_document_id = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="conditions")
    profile_user = relationship("PatientMedicalProfile", foreign_keys=[user_id], primaryjoin="PatientCondition.user_id == PatientMedicalProfile.user_id", overlaps="conditions")


class PatientAllergy(Base):
    __tablename__ = "patient_allergies"

    allergy_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    allergen_name = Column(String)
    allergy_type = Column(String, default='suspected')   # confirmed|suspected
    reaction_description = Column(Text, nullable=True)
    severity = Column(String, nullable=True)   # mild|moderate|severe
    source_type = Column(String, default='user_reported')
    source_document_id = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="allergies")
    profile_user = relationship("PatientMedicalProfile", foreign_keys=[user_id], primaryjoin="PatientAllergy.user_id == PatientMedicalProfile.user_id", overlaps="allergies")


class PatientMedication(Base):
    __tablename__ = "patient_medications"

    medication_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    medication_name = Column(String)
    medication_type = Column(String, default='medication')   # medication|supplement
    dose = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    gi_concern_notes = Column(Text, nullable=True)
    source_type = Column(String, default='user_reported')
    source_document_id = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="medications")
    profile_user = relationship("PatientMedicalProfile", foreign_keys=[user_id], primaryjoin="PatientMedication.user_id == PatientMedicalProfile.user_id", overlaps="medications")


class LabResult(Base):
    __tablename__ = "lab_results"

    lab_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    test_name = Column(String)
    test_value = Column(String)
    unit = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    result_status = Column(String, nullable=True)   # normal|abnormal|critical|unknown
    test_date = Column(String, nullable=True)
    source_document_id = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="lab_results")


class SymptomEntry(Base):
    __tablename__ = "symptom_entries"

    symptom_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    entry_date = Column(String)  # YYYY-MM-DD
    entry_time = Column(String, nullable=True)
    bloating = Column(Integer, default=0)     # 0-10 severity
    abdominal_pain = Column(Integer, default=0)
    gas = Column(Integer, default=0)
    constipation = Column(Integer, default=0)
    diarrhea = Column(Integer, default=0)
    nausea = Column(Integer, default=0)
    heartburn = Column(Integer, default=0)
    bowel_frequency = Column(Integer, nullable=True)
    stool_type = Column(String, nullable=True)   # Bristol scale 1-7
    severity_overall = Column(Integer, default=0)
    meals_noted = Column(Text, nullable=True)
    stress_level = Column(Integer, nullable=True)  # 1-10
    sleep_hours = Column(Float, nullable=True)
    hydration_glasses = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="symptom_entries")


class ClinicalRecommendation(Base):
    __tablename__ = "clinical_recommendations"

    rec_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    recommendation_text = Column(Text)
    reasoning = Column(Text, nullable=True)
    category = Column(String, nullable=True)   # dietary|lifestyle|clinical|monitoring|urgent
    evidence_references = Column(Text, nullable=True)   # JSON string
    limitations = Column(Text, nullable=True)
    patient_data_used = Column(Text, nullable=True)  # JSON string of fields used
    is_urgent = Column(Integer, default=0)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="recommendations")
