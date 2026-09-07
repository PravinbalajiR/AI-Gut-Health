import requests
from typing import Optional
from app.schemas.product import ProductCreate

OFF_BASE_URL = "https://world.openfoodfacts.org/api/v0/product/"

def fetch_product_by_barcode(barcode: str) -> Optional[ProductCreate]:
    headers = {"User-Agent": "GutHealthAI/1.0 (test@example.com)"}
    response = requests.get(f"{OFF_BASE_URL}{barcode}.json", headers=headers)
    if response.status_code != 200:
        return None
    
    data = response.json()
    if data.get("status") != 1:
        return None
    
    product_data = data.get("product", {})
    nutriments = product_data.get("nutriments", {})
    
    return ProductCreate(
        product_name=product_data.get("product_name", "Unknown Product"),
        brand=product_data.get("brands"),
        category=product_data.get("categories"),
        barcode=barcode,
        calories=nutriments.get("energy-kcal_100g"),
        protein=nutriments.get("proteins_100g"),
        fat=nutriments.get("fat_100g"),
        carbohydrates=nutriments.get("carbohydrates_100g"),
        fiber=nutriments.get("fiber_100g"),
        sugar=nutriments.get("sugars_100g"),
        sodium=nutriments.get("sodium_100g"),
        processing_level=str(product_data.get("nova_group", "unknown")),
        source="Open Food Facts"
    )
