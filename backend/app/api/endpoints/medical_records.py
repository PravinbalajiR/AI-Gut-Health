from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.models.medical_models import MedicalDocument, MedicalRecordExtraction
from app.schemas.medical import DocumentRead, ExtractionRead, DocumentReviewRequest
from app.services import medical_record_service

router = APIRouter()

@router.post("/upload", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    ai_consent: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Basic size validation (< 10MB)
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 10MB.")
        
    doc = await medical_record_service.process_medical_document(db, current_user.user_id, file, ai_consent)
    return doc

@router.get("", response_model=List[DocumentRead])
def get_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MedicalDocument).filter(MedicalDocument.user_id == current_user.user_id).order_by(MedicalDocument.uploaded_at.desc()).all()

@router.get("/{document_id}/extractions", response_model=List[ExtractionRead])
def get_document_extractions(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(MedicalDocument).filter(MedicalDocument.document_id == document_id, MedicalDocument.user_id == current_user.user_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return db.query(MedicalRecordExtraction).filter(MedicalRecordExtraction.document_id == document_id).all()

@router.post("/{document_id}/review")
def review_extractions(
    document_id: int,
    review_req: DocumentReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(MedicalDocument).filter(MedicalDocument.document_id == document_id, MedicalDocument.user_id == current_user.user_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
        
    medical_record_service.apply_reviewed_extractions(db, current_user.user_id, document_id, review_req.extractions)
    return {"status": "ok", "message": "Review saved successfully"}

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(MedicalDocument).filter(MedicalDocument.document_id == document_id, MedicalDocument.user_id == current_user.user_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    db.delete(doc)
    db.commit()
    return {"status": "ok"}
