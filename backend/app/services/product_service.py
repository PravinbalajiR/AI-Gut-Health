from sqlalchemy.orm import Session
from app.models.models import Product, Ingredient, ProductIngredient, RegionalProduct
from app.schemas.product import ProductCreate
from typing import Optional, List
from app.services import off_client

def get_product_by_barcode(db: Session, barcode: str) -> Optional[Product]:
    return db.query(Product).filter(Product.barcode == barcode).first()

def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.product_id == product_id).first()

import os, json
from openai import AsyncOpenAI

async def generate_generic_product(db: Session, query: str) -> Optional[Product]:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return None
        
    prompt = (
        f"The user searched for a food item: '{query}'. "
        "If this is a recognizable food item (like 'onion', 'tomato', 'apple', 'chicken breast'), "
        "provide a generic nutritional profile per 100g. "
        "Output ONLY a valid JSON object (no markdown, no extra text) with these exact keys: "
        "product_name (use a clean, capitalized name like 'Fresh Tomato'), "
        "calories (number), protein (number), fat (number), carbohydrates (number), "
        "fiber (number), sugar (number), sodium (number), processing_level (1 for unprocessed, 3 for processed, 4 for ultra-processed). "
        "If it's not a real food, return an empty JSON object: {}."
    )
    
    try:
        client = AsyncOpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1", default_headers={"HTTP-Referer": "http://localhost:5173", "X-Title": "Gut Health AI"})
        response = await client.chat.completions.create(
            model="qwen/qwen-2.5-7b-instruct",
            messages=[{"role": "user", "content": prompt}]
        )
        clean_text = response.choices[0].message.content.replace('```json', '').replace('```', '').strip()
        item_data = json.loads(clean_text)
        
        if not item_data or 'product_name' not in item_data:
            return None
            
        product = Product(
            product_name=item_data.get('product_name'),
            barcode="GENERIC_" + item_data.get('product_name').replace(" ", "_").upper(),
            brand="Generic Fresh Food",
            category="Groceries",
            source="AI Nutrition Database",
            calories=float(item_data.get('calories', 0)),
            protein=float(item_data.get('protein', 0)),
            fat=float(item_data.get('fat', 0)),
            carbohydrates=float(item_data.get('carbohydrates', 0)),
            fiber=float(item_data.get('fiber', 0)),
            sugar=float(item_data.get('sugar', 0)),
            sodium=float(item_data.get('sodium', 0)),
            processing_level=str(int(item_data.get('processing_level', 1)))
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    except Exception as e:
        print("Failed to generate generic product:", e)
        db.rollback()
        return None

async def search_products(db: Session, query: str, limit: int = 20) -> List[Product]:
    # Search locally first
    local_results = db.query(Product).filter(Product.product_name.ilike(f"%{query}%")).limit(limit).all()
    
    # If we have enough local results, return them
    if len(local_results) >= 5:
        return local_results
        
    # Generate a generic profile via AI if we don't have good local matches
    generic_product = await generate_generic_product(db, query)
    
    # Fetch more from Open Food Facts
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
    results = db.query(Product).filter(Product.product_name.ilike(f"%{query}%")).limit(limit).all()
    if generic_product and generic_product not in results:
        results.insert(0, generic_product)
    return results

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
