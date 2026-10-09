from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Receipt
from app.models.medical_models import MedicalDocument, PatientCondition, SymptomEntry
from typing import Any, List

router = APIRouter()

@router.get("")
def get_medical_timeline(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    """
    Returns a unified chronological view of all health events.
    """
    timeline = []
    
    docs = db.query(MedicalDocument).filter(MedicalDocument.user_id == current_user.user_id).all()
    for d in docs:
        timeline.append({
            "type": "document",
            "title": f"Document Uploaded: {d.document_type or d.original_filename}",
            "date": d.document_date or d.uploaded_at.strftime("%Y-%m-%d"),
            "data": {"id": d.document_id, "status": d.processing_status}
        })
        
    conditions = db.query(PatientCondition).filter(PatientCondition.user_id == current_user.user_id).all()
    for c in conditions:
        timeline.append({
            "type": "condition",
            "title": f"Condition Reported: {c.condition_name}",
            "date": c.onset_date or c.created_at.strftime("%Y-%m-%d"),
            "data": {"status": c.status}
        })
        
    symptoms = db.query(SymptomEntry).filter(SymptomEntry.user_id == current_user.user_id).order_by(SymptomEntry.entry_date.desc()).limit(14).all()
    for s in symptoms:
        timeline.append({
            "type": "symptom",
            "title": f"Symptom Logged",
            "date": s.entry_date,
            "data": {"severity": s.severity_overall, "notes": s.notes}
        })
        
    receipts = db.query(Receipt).filter(Receipt.user_id == current_user.user_id).order_by(Receipt.created_at.desc()).limit(5).all()
    for r in receipts:
        timeline.append({
            "type": "receipt",
            "title": f"Grocery Receipt Logged ({r.store_name})",
            "date": r.purchase_date.strftime("%Y-%m-%d") if r.purchase_date else r.created_at.strftime("%Y-%m-%d"),
            "data": {"items": len(r.items)}
        })
        
    # Sort descending by date
    timeline.sort(key=lambda x: x["date"], reverse=True)
    return timeline
