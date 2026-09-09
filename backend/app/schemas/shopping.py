from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.product import ProductRead

class ShoppingListItemCreate(BaseModel):
    product_id: int

class ShoppingListItemRead(BaseModel):
    item_id: int
    list_id: int
    product_id: int
    added_at: datetime
    is_purchased: int
    product: ProductRead

    class Config:
        from_attributes = True

class ShoppingListCreate(BaseModel):
    name: str = "My Shopping List"

class ShoppingListRead(BaseModel):
    list_id: int
    user_id: int
    name: str
    created_at: datetime
    items: List[ShoppingListItemRead] = []

    class Config:
        from_attributes = True

class RecommendationRequest(BaseModel):
    product_id: int

class RecommendedProduct(BaseModel):
    product: ProductRead
    reason: str
    gut_score: float
