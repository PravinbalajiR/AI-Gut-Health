from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.score import GutScoreRead, FoodDiversityScoreRead
from app.services import gut_score_service

router = APIRouter()

@router.get("/product/{product_id}")
def get_product_score(product_id: int, db: Session = Depends(get_db)):
    score = gut_score_service.calculate_product_gut_score(db, product_id)
    if not score:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Inject ML explainability if model is available
    from ml.src.predict import ml_service
    product = db.query(Product).filter(Product.product_id == product_id).first()
    prediction = ml_service.predict_product({
        "calories": product.calories,
        "protein": product.protein,
        "carbohydrates": product.carbohydrates,
        "fat": product.fat,
        "fiber": product.fiber,
        "sugar": product.sugar,
        "sodium": product.sodium,
        "processing_level": product.processing_level
    })
    
    response = {
        "score_id": score.score_id,
        "product_id": score.product_id,
        "fiber_score": score.fiber_score,
        "processing_score": score.processing_score,
        "sugar_score": score.sugar_score,
        "additive_score": score.additive_score,
        "final_gut_score": score.final_gut_score,
        "is_ml_prediction": prediction is not None
    }
    
    if prediction:
        response["explanations"] = prediction.get("explanations", [])
        response["confidence"] = prediction.get("confidence", 0)
        
    return response

@router.get("/diversity/me", response_model=FoodDiversityScoreRead)
def get_my_diversity_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Calculate the food diversity score for the current user based on recent receipts.
    """
    return gut_score_service.calculate_user_diversity_score(db, current_user.user_id)
