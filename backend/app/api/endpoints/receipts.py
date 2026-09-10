from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.receipt import ReceiptRead
from app.services import receipt_service

router = APIRouter()

from fastapi.concurrency import run_in_threadpool

@router.post("/upload", response_model=ReceiptRead)
async def upload_receipt(
    file: UploadFile = File(...),
    store_name: str = Form("Unknown Store"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Upload a receipt image, perform OCR, and link found products.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    image_bytes = await file.read()
    try:
        receipt = await receipt_service.create_receipt_with_items(
            db, 
            current_user.user_id, 
            image_bytes,
            store_name
        )
        return receipt
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ReceiptRead])
def read_receipts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get all receipts for the current user.
    """
    return receipt_service.get_user_receipts(db, user_id=current_user.user_id)


@router.delete("/all")
def reset_all_receipts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete ALL receipts (and their items) for the current user.
    This resets the weekly report so a fresh receipt can be scanned.
    """
    from app.models.models import Receipt, ReceiptItem
    receipts = db.query(Receipt).filter(Receipt.user_id == current_user.user_id).all()
    count = len(receipts)
    for receipt in receipts:
        db.query(ReceiptItem).filter(ReceiptItem.receipt_id == receipt.receipt_id).delete()
        db.delete(receipt)
    db.commit()
    return {"deleted_receipts": count, "message": f"Cleared {count} receipt(s). Upload a new receipt to start fresh!"}
