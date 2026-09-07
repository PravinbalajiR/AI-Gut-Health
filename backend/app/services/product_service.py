from sqlalchemy.orm import Session
from app.models.models import Product
from app.schemas.product import ProductCreate
from typing import Optional, List
from app.services import off_client

def get_product_by_barcode(db: Session, barcode: str) -> Optional[Product]:
    return db.query(Product).filter(Product.barcode == barcode).first()

def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.product_id == product_id).first()

def search_products(db: Session, query: str, limit: int = 20) -> List[Product]:
    return db.query(Product).filter(Product.product_name.ilike(f"%{query}%")).limit(limit).all()

def create_product(db: Session, product_in: ProductCreate) -> Product:
    db_obj = Product(**product_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def fetch_and_store_product(db: Session, barcode: str) -> Optional[Product]:
    # Check if we already have it
    existing = get_product_by_barcode(db, barcode)
    if existing:
        return existing
    
    # Try fetching from OFF
    off_product = off_client.fetch_product_by_barcode(barcode)
    if off_product:
        return create_product(db, off_product)
    
    return None
