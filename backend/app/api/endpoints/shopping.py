from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, ShoppingList, ShoppingListItem, Product, GutScore
from app.schemas.shopping import ShoppingListRead, ShoppingListCreate, ShoppingListItemCreate, ShoppingListItemRead, RecommendedProduct, RecommendationRequest
from app.schemas.product import ProductRead

router = APIRouter()

@router.get("/list", response_model=ShoppingListRead)
def get_or_create_shopping_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Get user's default list, or create one if it doesn't exist
    shop_list = db.query(ShoppingList).filter(ShoppingList.user_id == current_user.user_id).first()
    if not shop_list:
        shop_list = ShoppingList(user_id=current_user.user_id)
        db.add(shop_list)
        db.commit()
        db.refresh(shop_list)
    return shop_list

@router.post("/items", response_model=ShoppingListItemRead)
def add_item_to_list(
    item_in: ShoppingListItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    shop_list = db.query(ShoppingList).filter(ShoppingList.user_id == current_user.user_id).first()
    if not shop_list:
        shop_list = ShoppingList(user_id=current_user.user_id)
        db.add(shop_list)
        db.commit()
        db.refresh(shop_list)
        
    # Check if item already exists in the list
    existing = db.query(ShoppingListItem).filter(
        ShoppingListItem.list_id == shop_list.list_id,
        ShoppingListItem.product_id == item_in.product_id
    ).first()
    
    if existing:
        return existing
        
    new_item = ShoppingListItem(
        list_id=shop_list.list_id,
        product_id=item_in.product_id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/items/{item_id}")
def remove_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    item = db.query(ShoppingListItem).join(ShoppingList).filter(
        ShoppingListItem.item_id == item_id,
        ShoppingList.user_id == current_user.user_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in your shopping list")
        
    db.delete(item)
    db.commit()
    return {"status": "success"}

@router.post("/recommendations", response_model=List[RecommendedProduct])
def get_recommendations(
    req: RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Get the target product
    target = db.query(Product).filter(Product.product_id == req.product_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Mocking real recommendation engine logic:
    # Find products in the SAME category that have a HIGHER gut score
    # In a real scenario, this would use a complex AI similarity search or a vector database.
    # For now, we query the local database for items matching the category prefix.
    
    cat_prefix = target.category.split(',')[0] if target.category else None
    
    if not cat_prefix:
        # Fallback to general high-scoring items
        candidates = db.query(GutScore).filter(GutScore.final_gut_score > 70).limit(3).all()
    else:
        # Query matching category and gut score > target's gut score
        # Let's just find anything in the DB that has a score
        candidates = db.query(GutScore).join(Product).filter(
            GutScore.final_gut_score > 60
        ).order_by(GutScore.final_gut_score.desc()).limit(3).all()
        
    recs = []
    for c in candidates:
        if c.product_id != target.product_id:
            reason = "Higher fiber and less processed"
            if c.final_gut_score > 80:
                reason = "Excellent overall gut health profile"
                
            recs.append(RecommendedProduct(
                product=c.product,
                reason=reason,
                gut_score=c.final_gut_score
            ))
            
    return recs
