from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, ShoppingList, ShoppingListItem, Product, Receipt, ReceiptItem
from app.schemas.shopping import ShoppingListRead, ShoppingListItemCreate, ShoppingListItemRead
import google.generativeai as genai
import json, os
from datetime import datetime, timedelta, timezone

router = APIRouter()


def _get_or_create_list(db: Session, user_id: int) -> ShoppingList:
    shop_list = db.query(ShoppingList).filter(ShoppingList.user_id == user_id).first()
    if not shop_list:
        shop_list = ShoppingList(user_id=user_id)
        db.add(shop_list)
        db.commit()
        db.refresh(shop_list)
    return shop_list


# ── GET list ──────────────────────────────────────────────────────────────────
@router.get("/list", response_model=ShoppingListRead)
def get_or_create_shopping_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return _get_or_create_list(db, current_user.user_id)


# ── ADD item by product_id ────────────────────────────────────────────────────
@router.post("/items", response_model=ShoppingListItemRead)
def add_item_to_list(
    item_in: ShoppingListItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    shop_list = _get_or_create_list(db, current_user.user_id)
    existing = db.query(ShoppingListItem).filter(
        ShoppingListItem.list_id == shop_list.list_id,
        ShoppingListItem.product_id == item_in.product_id
    ).first()
    if existing:
        return existing
    new_item = ShoppingListItem(list_id=shop_list.list_id, product_id=item_in.product_id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


# ── ADD item by name (creates a minimal product if it doesn't exist) ──────────
class AddByNameRequest(BaseModel):
    name: str

@router.post("/items/by-name", response_model=ShoppingListItemRead)
def add_item_by_name(
    req: AddByNameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    shop_list = _get_or_create_list(db, current_user.user_id)
    name = req.name.strip()
    # Check if a product with this name already exists
    product = db.query(Product).filter(
        Product.product_name.ilike(f"%{name}%")
    ).first()
    if not product:
        # Create a placeholder product
        product = Product(product_name=name, processing_level=1)
        db.add(product)
        db.commit()
        db.refresh(product)
    # Check if already in list
    existing = db.query(ShoppingListItem).filter(
        ShoppingListItem.list_id == shop_list.list_id,
        ShoppingListItem.product_id == product.product_id
    ).first()
    if existing:
        return existing
    new_item = ShoppingListItem(list_id=shop_list.list_id, product_id=product.product_id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


# ── TOGGLE purchased ──────────────────────────────────────────────────────────
@router.patch("/items/{item_id}/toggle")
def toggle_purchased(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    item = db.query(ShoppingListItem).join(ShoppingList).filter(
        ShoppingListItem.item_id == item_id,
        ShoppingList.user_id == current_user.user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_purchased = 0 if item.is_purchased else 1
    db.commit()
    return {"item_id": item_id, "is_purchased": item.is_purchased}


# ── DELETE item ────────────────────────────────────────────────────────────────
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


# ── CLEAR purchased items ─────────────────────────────────────────────────────
@router.delete("/items/purchased/clear")
def clear_purchased(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    shop_list = _get_or_create_list(db, current_user.user_id)
    deleted = db.query(ShoppingListItem).filter(
        ShoppingListItem.list_id == shop_list.list_id,
        ShoppingListItem.is_purchased == 1
    ).delete()
    db.commit()
    return {"cleared": deleted}


# ── AI SUGGESTIONS ────────────────────────────────────────────────────────────
@router.get("/suggestions")
async def get_ai_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Use Gemini to suggest gut-healthy items to add based on recent receipt data."""
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    receipts = db.query(Receipt).filter(
        Receipt.user_id == current_user.user_id,
        Receipt.created_at >= seven_days_ago
    ).all()

    scanned_items = []
    for r in receipts:
        for item in r.items:
            if item.product:
                scanned_items.append(item.product.product_name)

    # Also get what's already in the shopping list
    shop_list = _get_or_create_list(db, current_user.user_id)
    in_list = [i.product.product_name for i in shop_list.items if i.product]

    if not scanned_items:
        # No receipt data — return generic gut-health staples
        return {
            "suggestions": [
                {"name": "Live Yogurt", "reason": "Excellent probiotic source for gut microbiome"},
                {"name": "Kefir", "reason": "Rich in diverse beneficial bacteria strains"},
                {"name": "Oats", "reason": "Prebiotic beta-glucan fiber feeds good gut bacteria"},
                {"name": "Sauerkraut", "reason": "Fermented food with natural probiotics"},
                {"name": "Garlic", "reason": "Powerful prebiotic that boosts Lactobacillus"},
                {"name": "Flaxseeds", "reason": "Soluble fiber and omega-3 for gut lining health"},
            ]
        }

    prompt = (
        f"A user bought these items this week: {json.dumps(scanned_items)}.\n"
        f"They already have these in their shopping list: {json.dumps(in_list)}.\n\n"
        "Based on what they bought, suggest 6 specific gut-healthy items they are MISSING "
        "that would complement their diet and improve their gut microbiome diversity. "
        "Focus on probiotics, prebiotics, fermented foods, high-fiber foods, and diverse vegetables.\n"
        "Do NOT suggest items already in their scanned list or shopping list.\n"
        "Return ONLY valid JSON (no markdown): "
        '[{"name": "product name", "reason": "specific gut benefit"}, ...]'
    )

    try:
        model = genai.GenerativeModel('gemini-3.1-flash-lite')
        response = await model.generate_content_async(prompt)
        raw = response.text.replace('```json', '').replace('```', '').strip()
        suggestions = json.loads(raw)
        return {"suggestions": suggestions[:6]}
    except Exception as e:
        return {"suggestions": [], "error": str(e)}



