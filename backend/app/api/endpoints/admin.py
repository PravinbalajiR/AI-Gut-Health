from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Any, Dict, List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Product, Receipt, GutScore
from app.schemas.product import ProductRead

router = APIRouter()

# In a real app, you would have a `get_current_active_superuser` dependency
# For this dev environment, we'll just require a logged in user.

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    user_count = db.query(User).count()
    product_count = db.query(Product).count()
    receipt_count = db.query(Receipt).count()
    
    # Calculate average gut score across all analyzed products
    avg_score = db.query(func.avg(GutScore.final_gut_score)).scalar() or 0.0
    
    return {
        "total_users": user_count,
        "total_products": product_count,
        "total_receipts": receipt_count,
        "average_system_gut_score": round(avg_score, 1)
    }

@router.get("/products", response_model=List[ProductRead])
def list_all_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return db.query(Product).order_by(Product.product_id.desc()).limit(100).all()

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db.delete(product)
    db.commit()
    return {"status": "success"}
