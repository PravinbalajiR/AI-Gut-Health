import os
import io
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import UploadFile
import pdfplumber
from PIL import Image
import pytesseract
from openai import AsyncOpenAI
from app.models.medical_models import MedicalDocument, MedicalRecordExtraction, PatientCondition, PatientAllergy, PatientMedication, LabResult

# Reusing same Tesseract path logic
TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

async def process_medical_document(db: Session, user_id: int, file: UploadFile, consent_given: bool) -> MedicalDocument:
    content = await file.read()
    
    # Create document record
    doc = MedicalDocument(
        user_id=user_id,
        original_filename=file.filename,
        file_type=file.content_type,
        file_size_bytes=len(content),
        ai_consent_given=1 if consent_given else 0,
        processing_status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    try:
        extracted_text = ""
        # 1. Text extraction
        if file.content_type == "application/pdf":
            try:
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            extracted_text += page_text + "\n"
            except Exception as e:
                print(f"PDF text extraction failed, trying OCR: {e}")
        elif file.content_type.startswith("image/"):
            image = Image.open(io.BytesIO(content))
            extracted_text = pytesseract.image_to_string(image)
            
        if not extracted_text.strip():
            # Try OCR on PDF if no text
            if file.content_type == "application/pdf":
                # We would use pdf2image here in a real prod env, but for now we fallback
                pass
                
        doc.raw_extracted_text = extracted_text
        
        # 2. AI Extraction
        if consent_given and extracted_text.strip():
            await perform_ai_extraction(db, doc, extracted_text)
        
        doc.processing_status = "needs_review"
        doc.processed_at = datetime.now(timezone.utc)
        
    except Exception as e:
        doc.processing_status = "failed"
        doc.processing_error = str(e)
        
    db.commit()
    return doc

async def perform_ai_extraction(db: Session, doc: MedicalDocument, text: str):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return
        
    prompt = """
    Extract structured medical information from the following clinical document text.
    Identify: document_type, document_date, issuing_clinician, issuing_facility.
    Also extract specific medical facts into an array of "extractions".
    For each extraction, provide:
    - field_type: "diagnosis", "lab_result", "medication", "allergy", "finding", or "recommendation"
    - field_name: e.g. "Hemoglobin", "IBS", "Lisinopril"
    - extracted_value: the main value
    - extracted_unit: if applicable
    - reference_range: if applicable
    - confidence_note: "high", "medium", "low"
    - original_text: exactly as it appeared in the document
    
    Return ONLY a raw JSON object with:
    {
      "document_type": "", "document_date": "", "issuing_clinician": "", "issuing_facility": "",
      "extractions": [ { field_type, field_name, extracted_value, extracted_unit, reference_range, confidence_note, original_text } ]
    }
    """
    
    client = AsyncOpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
    try:
        response = await client.chat.completions.create(
            model="qwen/qwen-2.5-7b-instruct",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text[:8000]} # Limit to avoid context window issues
            ]
        )
        clean_text = response.choices[0].message.content.replace('```json', '').replace('```', '').strip()
        data = json.loads(clean_text)
        
        doc.document_type = data.get("document_type")
        doc.document_date = data.get("document_date")
        doc.issuing_clinician = data.get("issuing_clinician")
        doc.issuing_facility = data.get("issuing_facility")
        
        for ext in data.get("extractions", []):
            db_ext = MedicalRecordExtraction(
                document_id=doc.document_id,
                user_id=doc.user_id,
                field_type=ext.get("field_type", "finding"),
                field_name=ext.get("field_name", "Unknown"),
                extracted_value=ext.get("extracted_value", ""),
                extracted_unit=ext.get("extracted_unit"),
                reference_range=ext.get("reference_range"),
                document_date=doc.document_date,
                original_text=ext.get("original_text"),
                confidence_note=ext.get("confidence_note", "medium")
            )
            db.add(db_ext)
            
    except Exception as e:
        print(f"AI extraction failed: {e}")

def apply_reviewed_extractions(db: Session, user_id: int, document_id: int, reviews: list):
    """Save reviewed extractions to actual clinical profile."""
    # reviews is a list of ExtractionReview schemas
    for review in reviews:
        ext = db.query(MedicalRecordExtraction).filter(
            MedicalRecordExtraction.extraction_id == review.extraction_id,
            MedicalRecordExtraction.user_id == user_id
        ).first()
        
        if not ext: continue
        
        ext.review_status = review.review_status
        if review.user_correction:
            ext.user_correction = review.user_correction
            ext.extracted_value = review.user_correction
            
        if ext.review_status == 'confirmed':
            # Add to the appropriate clinical table
            if ext.field_type == 'diagnosis':
                db.add(PatientCondition(
                    user_id=user_id, condition_name=ext.field_name, notes=ext.extracted_value,
                    source_type="document", source_document_id=document_id
                ))
            elif ext.field_type == 'allergy':
                db.add(PatientAllergy(
                    user_id=user_id, allergen_name=ext.field_name, severity=ext.extracted_value,
                    source_type="document", source_document_id=document_id
                ))
            elif ext.field_type == 'medication':
                db.add(PatientMedication(
                    user_id=user_id, medication_name=ext.field_name, dose=ext.extracted_value,
                    source_type="document", source_document_id=document_id
                ))
            elif ext.field_type == 'lab_result':
                db.add(LabResult(
                    user_id=user_id, test_name=ext.field_name, test_value=ext.extracted_value,
                    unit=ext.extracted_unit, reference_range=ext.reference_range,
                    test_date=ext.document_date, source_document_id=document_id
                ))
    
    doc = db.query(MedicalDocument).filter(MedicalDocument.document_id == document_id).first()
    if doc:
        doc.processing_status = 'complete'
        
    db.commit()
