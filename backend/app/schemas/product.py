from pydantic import BaseModel
from typing import Optional, List

class ProductBase(BaseModel):
    product_name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrates: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    processing_level: Optional[str] = None
    source: Optional[str] = None

class ProductCreate(ProductBase):
    ingredients_list: Optional[List[str]] = []
    regions_list: Optional[List[str]] = []

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    brand: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrates: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    processing_level: Optional[str] = None

class ProductRead(ProductBase):
    product_id: int
    ingredients: Optional[List[str]] = []
    regions: Optional[List[str]] = []

    class Config:
        from_attributes = True
