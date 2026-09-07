from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.product import ProductRead, ProductCreate
from app.services import product_service

router = APIRouter()

@router.get("/search", response_model=List[ProductRead])
def search_products(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Search for products by name.
    """
    products = product_service.search_products(db, query=query)
    return products

@router.get("/barcode/{barcode}", response_model=ProductRead)
def get_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a product by barcode. If not in DB, fetches from Open Food Facts.
    """
    product = product_service.fetch_and_store_product(db, barcode=barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found locally or on Open Food Facts")
    return product

@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a product by ID.
    """
    product = product_service.get_product_by_id(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
