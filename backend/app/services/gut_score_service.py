from sqlalchemy.orm import Session
from app.models.models import Product, GutScore, Receipt, ReceiptItem, ProductIngredient, Ingredient, FoodDiversityScore
from datetime import datetime, timedelta, timezone
import re

def calculate_product_gut_score(db: Session, product_id: int) -> GutScore:
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        return None
        
    # Check if we already calculated it recently
    existing = db.query(GutScore).filter(Product.product_id == product_id).first()
    if existing:
        return existing
        
    # 1. Fiber Score (0-100) - Assuming 10g/100g is excellent (100)
    fiber = product.fiber or 0
    fiber_score = min(100.0, (fiber / 10.0) * 100.0)
    
    # 2. Sugar Score (0-100) - Assuming 0g is 100, 25g+ is 0
    sugar = product.sugar or 0
    sugar_score = max(0.0, 100.0 - ((sugar / 25.0) * 100.0))
    
    # 3. Processing Score (NOVA group)
    nova_map = {"1": 100.0, "2": 75.0, "3": 40.0, "4": 0.0, "unknown": 50.0}
    processing_score = nova_map.get(str(product.processing_level), 50.0)
    
    # 4. Additive Score - Penalize for E-numbers in ingredients
    ingredients = [pi.ingredient.ingredient_name.lower() for pi in product.product_ingredients]
    e_numbers = sum(1 for ing in ingredients if re.search(r'\be\d{3,4}[a-z]?\b', ing))
    additive_score = max(0.0, 100.0 - (e_numbers * 20.0))
    
    # 5. Final Score Weighted Average
    final_score = (fiber_score * 0.4) + (processing_score * 0.3) + (sugar_score * 0.2) + (additive_score * 0.1)
    
    score = GutScore(
        product_id=product.product_id,
        fiber_score=round(fiber_score, 1),
        processing_score=round(processing_score, 1),
        sugar_score=round(sugar_score, 1),
        additive_score=round(additive_score, 1),
        diversity_score=0.0, # Not used at product level
        final_gut_score=round(final_score, 1)
    )
    
    db.add(score)
    db.commit()
    db.refresh(score)
    return score

def calculate_user_diversity_score(db: Session, user_id: int) -> FoodDiversityScore:
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Get all ingredients from products in receipts from the last 7 days
    receipts = db.query(Receipt).filter(Receipt.user_id == user_id, Receipt.created_at >= seven_days_ago).all()
    
    unique_ingredients = set()
    for receipt in receipts:
        for item in receipt.items:
            for pi in item.product.product_ingredients:
                unique_ingredients.add(pi.ingredient.ingredient_name.lower())
                
    # Target is 30 unique ingredients per week
    score_val = min(100.0, (len(unique_ingredients) / 30.0) * 100.0)
    
    today = datetime.now(timezone.utc).date()
    # Check if a score for today already exists
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
