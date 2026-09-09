import requests
from typing import Optional, List
from app.schemas.product import ProductCreate

OFF_BASE_URL = "https://world.openfoodfacts.org/api/v0/product/"

def _extract_product_data(product_data: dict, barcode: str) -> Optional[ProductCreate]:
    name = product_data.get("product_name")
    if not name:
        return None
        
    nutriments = product_data.get("nutriments", {})
    
    # Extract ingredients
    ingredients = product_data.get("ingredients", [])
    ingredients_list = [ing.get("text", "") for ing in ingredients if ing.get("text")]
    # Fallback to ingredients_text if structured ingredients not found
    if not ingredients_list and product_data.get("ingredients_text"):
        ingredients_list = [i.strip() for i in product_data.get("ingredients_text").split(",") if i.strip()]
        
    # Extract regions/countries
    regions_list = product_data.get("countries_tags", [])
    regions_list = [r.replace("en:", "").replace("-", " ").title() for r in regions_list if r.startswith("en:")]
    
    return ProductCreate(
        product_name=name,
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
        source="Open Food Facts",
        ingredients_list=ingredients_list,
        regions_list=regions_list
    )

def fetch_product_by_barcode(barcode: str) -> Optional[ProductCreate]:
    headers = {"User-Agent": "GutHealthAI/1.0 (test@example.com)"}
    response = requests.get(f"{OFF_BASE_URL}{barcode}.json", headers=headers)
    if response.status_code != 200:
        return None
    
    data = response.json()
    if data.get("status") != 1:
        return None
    
    return _extract_product_data(data.get("product", {}), barcode)

def search_products_by_name(query: str, limit: int = 5) -> List[ProductCreate]:
    headers = {"User-Agent": "GutHealthAI/1.0 (test@example.com)"}
    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1&page_size={limit}"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        return []
        
    data = response.json()
    products = data.get("products", [])
    
    results = []
    for product_data in products:
        barcode = product_data.get("code")
        if not barcode:
            continue
            
        product = _extract_product_data(product_data, barcode)
        if product:
            results.append(product)
            
    return results
