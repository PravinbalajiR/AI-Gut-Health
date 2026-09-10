from sqlalchemy.orm import Session
from app.models.models import Product, GutScore, Receipt, ReceiptItem, ProductIngredient, Ingredient, FoodDiversityScore
from datetime import datetime, timedelta, timezone
import re
from ml.src.predict import ml_service

def calculate_product_gut_score(db: Session, product_id: int) -> GutScore:
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        return None
        
    # Check if we already calculated it recently
    existing = db.query(GutScore).filter(GutScore.product_id == product_id).first()
    
    # ML Prediction
    ml_prediction = ml_service.predict_product({
        "calories": product.calories,
        "protein": product.protein,
        "carbohydrates": product.carbohydrates,
        "fat": product.fat,
        "fiber": product.fiber,
        "sugar": product.sugar,
        "sodium": product.sodium,
        "processing_level": product.processing_level
    })
    
    if ml_prediction:
        fiber_score = ml_prediction["gut_suitability_score"]
        processing_score = 0
        sugar_score = 0
        additive_score = ml_prediction["confidence"] * 100
        final_score = ml_prediction["gut_suitability_score"]
    else:
        # Rule-based fallback
        fiber = product.fiber or 0
        fiber_score = min(100.0, (fiber / 10.0) * 100.0)
        
        sugar = product.sugar or 0
        sugar_score = max(0.0, 100.0 - ((sugar / 25.0) * 100.0))
        
        nova_map = {"1": 100.0, "2": 75.0, "3": 40.0, "4": 0.0, "unknown": 50.0}
        processing_score = nova_map.get(str(product.processing_level), 50.0)
        
        ingredients = [pi.ingredient.ingredient_name.lower() for pi in product.product_ingredients]
        e_numbers = sum(1 for ing in ingredients if re.search(r'\be\d{3,4}[a-z]?\b', ing))
        additive_score = max(0.0, 100.0 - (e_numbers * 20.0))
        
        final_score = (fiber_score * 0.4) + (processing_score * 0.3) + (sugar_score * 0.2) + (additive_score * 0.1)
    
    if existing:
        existing.fiber_score = round(fiber_score, 1)
        existing.processing_score = round(processing_score, 1)
        existing.sugar_score = round(sugar_score, 1)
        existing.additive_score = round(additive_score, 1)
        existing.final_gut_score = round(final_score, 1)
        existing.calculated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
        
    score = GutScore(
        product_id=product.product_id,
        fiber_score=round(fiber_score, 1),
        processing_score=round(processing_score, 1),
        sugar_score=round(sugar_score, 1),
        additive_score=round(additive_score, 1),
        diversity_score=0.0,
        final_gut_score=round(final_score, 1)
    )
    
    db.add(score)
    db.commit()
    db.refresh(score)
    return score

def calculate_user_diversity_score(db: Session, user_id: int) -> FoodDiversityScore:
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    receipts = db.query(Receipt).filter(Receipt.user_id == user_id, Receipt.created_at >= seven_days_ago).all()
    
    unique_foods = set()
    for receipt in receipts:
        for item in receipt.items:
            if item.product:
                # Count unique product names (works for both USDA seeded products
                # and Gemini-generated products which have no ingredient rows)
                unique_foods.add(item.product.product_name.lower().strip())
                # Also count ingredient names if they exist (older USDA products)
                for pi in item.product.product_ingredients:
                    unique_foods.add(pi.ingredient.ingredient_name.lower())
                
    score_val = min(100.0, (len(unique_foods) / 30.0) * 100.0)
    
    today = datetime.now(timezone.utc).date()
    existing = db.query(FoodDiversityScore).filter(
        FoodDiversityScore.user_id == user_id,
        FoodDiversityScore.calculated_date == today
    ).first()
    
    if existing:
        existing.score = round(score_val, 1)
        db.commit()
        db.refresh(existing)
        return existing
        
    new_score = FoodDiversityScore(
        user_id=user_id,
        score=round(score_val, 1),
        calculated_date=today
    )
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    return new_score
