from sqlalchemy.orm import Session
from app.models.models import Product, Ingredient, ProductIngredient, RegionalProduct
from app.schemas.product import ProductCreate
from typing import Optional, List
from app.services import off_client

def get_product_by_barcode(db: Session, barcode: str) -> Optional[Product]:
    return db.query(Product).filter(Product.barcode == barcode).first()

def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.product_id == product_id).first()

def search_products(db: Session, query: str, limit: int = 20) -> List[Product]:
    # Search locally first
    local_results = db.query(Product).filter(Product.product_name.ilike(f"%{query}%")).limit(limit).all()
    
    # If we have enough local results, return them
    if len(local_results) >= limit // 2:
        return local_results
        
    # Otherwise, fetch more from Open Food Facts
    off_results = off_client.search_products_by_name(query, limit=5)
    
    # Save them to DB if they don't exist
    for off_product in off_results:
        existing = get_product_by_barcode(db, off_product.barcode)
        if not existing:
            try:
                create_product(db, off_product)
            except Exception:
                db.rollback()
                
    # Query again to get the combined results from DB
    return db.query(Product).filter(Product.product_name.ilike(f"%{query}%")).limit(limit).all()

def create_product(db: Session, product_in: ProductCreate) -> Product:
    data = product_in.dict()
    ingredients_list = data.pop('ingredients_list', [])
    regions_list = data.pop('regions_list', [])
    
    db_obj = Product(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Handle Ingredients
    for idx, ing_name in enumerate(ingredients_list):
        ing_name_clean = ing_name.strip()[:255]
        if not ing_name_clean:
            continue
        
        # Check if ingredient exists
        ingredient = db.query(Ingredient).filter(Ingredient.ingredient_name == ing_name_clean).first()
        if not ingredient:
            ingredient = Ingredient(ingredient_name=ing_name_clean)
            db.add(ingredient)
            db.commit()
            db.refresh(ingredient)
            
        # Link to product
        prod_ing = ProductIngredient(
            product_id=db_obj.product_id,
            ingredient_id=ingredient.ingredient_id,
            ingredient_order=idx + 1
        )
        db.add(prod_ing)
        
    # Handle Regions
    for region_name in regions_list:
        region_clean = region_name.strip()[:255]
        if region_clean:
            reg_obj = RegionalProduct(
                product_id=db_obj.product_id,
                region=region_clean
            )
            db.add(reg_obj)
            
    db.commit()
    return db_obj

def fetch_and_store_product(db: Session, barcode: str) -> Optional[Product]:
    # Check if we already have it
    existing = get_product_by_barcode(db, barcode)
    if existing:
        return existing
    
    # Try fetching from OFF
    off_product = off_client.fetch_product_by_barcode(barcode)
    if off_product:
        return create_product(db, off_product)
    
    return None
