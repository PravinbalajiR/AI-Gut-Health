from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from app.schemas.product import ProductRead

class ReceiptItemBase(BaseModel):
    product_id: Optional[int] = None
    extracted_text: Optional[str] = None # Added for OCR context
    quantity: int = 1

class ReceiptItemRead(ReceiptItemBase):
    receipt_item_id: int
    product: Optional[ProductRead] = None

    class Config:
        from_attributes = True

class ReceiptBase(BaseModel):
    store_name: Optional[str] = None
    purchase_date: Optional[date] = None
    receipt_image_url: Optional[str] = None
    raw_ocr_text: Optional[str] = None

class ReceiptCreate(ReceiptBase):
    pass

class ReceiptRead(ReceiptBase):
    receipt_id: int
    user_id: int
    created_at: datetime
    items: List[ReceiptItemRead] = []

    class Config:
        from_attributes = True
