from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.score import GutScoreRead, FoodDiversityScoreRead
from app.services import gut_score_service

router = APIRouter()

@router.get("/product/{product_id}", response_model=GutScoreRead)
def get_product_gut_score(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get or calculate the gut score for a specific product.
    """
    score = gut_score_service.calculate_product_gut_score(db, product_id)
    if not score:
        raise HTTPException(status_code=404, detail="Product not found")
    return score

@router.get("/diversity/me", response_model=FoodDiversityScoreRead)
def get_my_diversity_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Calculate the food diversity score for the current user based on recent receipts.
    """
    return gut_score_service.calculate_user_diversity_score(db, current_user.user_id)
