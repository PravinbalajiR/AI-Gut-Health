from sqlalchemy.orm import Session
from app.models.models import Receipt, ReceiptItem, Product
from app.schemas.receipt import ReceiptCreate
from app.services import ocr_service
from typing import List

async def create_receipt_with_items(db: Session, user_id: int, image_bytes: bytes, store_name: str = "Unknown Store") -> Receipt:
    # 1. Parse image and match products
    raw_text, matched_products = await ocr_service.process_receipt_image(db, image_bytes)
    
    # 2. Create Receipt
    receipt = Receipt(
        user_id=user_id,
        store_name=store_name,
        # skip saving actual image URL locally for MVP or just put a mock URL
        receipt_image_url="http://example.com/receipt.jpg",
        raw_ocr_text=raw_text
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    # 3. Create ReceiptItems
    for product in matched_products:
        item = ReceiptItem(
            receipt_id=receipt.receipt_id,
            product_id=product.product_id,
            quantity=1
        )
        db.add(item)
    
    db.commit()
    db.refresh(receipt)
    return receipt

def get_user_receipts(db: Session, user_id: int) -> List[Receipt]:
    return db.query(Receipt).filter(Receipt.user_id == user_id).order_by(Receipt.created_at.desc()).all()
