import pytesseract
from PIL import Image
import io
from fuzzywuzzy import process
from sqlalchemy.orm import Session
from app.models.models import Product
from typing import List, Tuple, Optional
import re
import os

# Common Windows installation path for Tesseract
TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

def extract_text_from_image(image_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text
    except pytesseract.TesseractNotFoundError:
        raise Exception("Tesseract OCR is not installed or not in PATH. Please install it from https://github.com/UB-Mannheim/tesseract/wiki and restart the server.")
    except Exception as e:
        raise Exception(f"Failed to process image: {str(e)}")

import google.generativeai as genai
import json

async def parse_receipt_lines(text: str) -> List[str]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            prompt = (
                "Extract the distinct food/grocery product names from this raw receipt OCR text. "
                "Ignore prices, weights, countries of origin, 'TOTAL', 'TAX', and non-food items. "
                "Output ONLY a valid JSON array of strings, like [\"Steak\", \"Milk\", \"Pears\"]. Do not output markdown blocks or any other text.\n\n"
                f"RECEIPT TEXT:\n{text}"
            )
            model = genai.GenerativeModel('gemini-3.1-flash-lite')
            response = await model.generate_content_async(prompt)
            clean_text = response.text.replace('```json', '').replace('```', '').strip()
            items = json.loads(clean_text)
            if isinstance(items, list) and len(items) > 0:
                print("Gemini successfully extracted receipt items:", items)
                return [str(i) for i in items]
        except Exception as e:
            print("Gemini receipt parsing failed, falling back to regex:", e)
            
    # Fallback basic cleaning
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        # Stop at total
        if 'total' in line.lower():
            break
        cleaned = re.sub(r'[^a-zA-Z0-9 ]', '', line).strip()
        # Take first 2-3 words, ignore numbers
        words = [w for w in cleaned.split() if not w.isnumeric()]
        if len(words) > 0:
            cleaned_lines.append(" ".join(words[:3]))
    return [c for c in cleaned_lines if len(c) > 3]

def match_product_fuzzy(db: Session, text_line: str, threshold: int = 85) -> Optional[Product]:
    # Fetch all product names to match against
    products = db.query(Product.product_id, Product.product_name).all()
    if not products:
        return None
        
    product_dict = {p.product_id: p.product_name for p in products if p.product_name}
    product_names = list(product_dict.values())
    
    # Use fuzzywuzzy to find the best match
    match = process.extractOne(text_line, product_names)
    
    if match and match[1] >= threshold:
        matched_name = match[0]
        # Find product by matched name
        for p_id, p_name in product_dict.items():
            if p_name == matched_name:
                return db.query(Product).filter(Product.product_id == p_id).first()
                
    return None

from fastapi.concurrency import run_in_threadpool

async def process_receipt_image(db: Session, image_bytes: bytes) -> Tuple[str, List[Product]]:
    text = await run_in_threadpool(extract_text_from_image, image_bytes)
    
    # 1. Get clean list of food names from Gemini
    food_names = await parse_receipt_lines(text)
    
    matched_products = []
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if api_key and food_names:
        try:
            print("Using Gemini to resolve nutritional profiles for:", food_names)
            prompt = (
                f"I have a list of food items from a grocery receipt: {json.dumps(food_names)}. "
                "For each item, provide a generic but realistic nutritional profile per 100g. "
                "Output ONLY a valid JSON array of objects with these exact keys: "
                "product_name (use a clean, capitalized name like 'Fresh Steak' or 'Pineapple'), "
                "calories, protein, fat, carbohydrates, fiber, sugar, sodium, processing_level (1 for unprocessed, 3 for processed, 4 for ultra-processed). "
                "Do not include markdown blocks or any other text."
            )
            model = genai.GenerativeModel('gemini-3.1-flash-lite')
            response = await model.generate_content_async(prompt)
            clean_text = response.text.replace('```json', '').replace('```', '').strip()
            items_data = json.loads(clean_text)
            
            for item in items_data:
                # Check if we already created this exact generic product before
                existing = db.query(Product).filter(Product.product_name == item.get('product_name')).first()
                if existing:
                    matched_products.append(existing)
                else:
                    # Create new generic product
                    try:
                        db_obj = Product(
                            product_name=item.get('product_name'),
                            barcode="GENERIC_" + item.get('product_name').replace(" ", "_").upper(),
                            brand="Generic Fresh Food",
                            category="Groceries",
                            source="AI Nutrition Database",
                            calories=float(item.get('calories', 0)),
                            protein=float(item.get('protein', 0)),
                            fat=float(item.get('fat', 0)),
                            carbohydrates=float(item.get('carbohydrates', 0)),
                            fiber=float(item.get('fiber', 0)),
                            sugar=float(item.get('sugar', 0)),
                            sodium=float(item.get('sodium', 0)),
                            processing_level=str(int(item.get('processing_level', 1)))
                        )
                        db.add(db_obj)
                        db.commit()
                        db.refresh(db_obj)
                        matched_products.append(db_obj)
                    except Exception as e:
                        print("Error saving generic product:", e)
                        db.rollback()
                        
            return text, matched_products
        except Exception as e:
            print("Gemini resolution failed, falling back to basic matching:", e)

    # 2. Fallback to awful fuzzy matching if Gemini fails
    for line in food_names:
        if len(line) < 4 or line.lower().startswith('total'):
            continue
            
        product = match_product_fuzzy(db, line)
        if product:
            matched_products.append(product)
                    
    return text, matched_products
