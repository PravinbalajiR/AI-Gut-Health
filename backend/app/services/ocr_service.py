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

def parse_receipt_lines(text: str) -> List[str]:
    # Basic cleaning, keeping alphanumeric and spaces
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        cleaned = re.sub(r'[^a-zA-Z0-9 ]', '', line).strip()
        if len(cleaned) > 3 and not cleaned.isnumeric():
            cleaned_lines.append(cleaned)
    return cleaned_lines

def match_product_fuzzy(db: Session, text_line: str, threshold: int = 70) -> Optional[Product]:
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

from app.services import off_client, product_service

def process_receipt_image(db: Session, image_bytes: bytes) -> Tuple[str, List[Product]]:
    text = extract_text_from_image(image_bytes)
    lines = parse_receipt_lines(text)
    
    matched_products = []
    for line in lines:
        # Ignore very short or obviously junk lines to prevent useless OFF queries
        if len(line) < 4 or line.lower().startswith('total'):
            continue
            
        product = match_product_fuzzy(db, line)
        if product:
            matched_products.append(product)
        else:
            # Fallback: Search Open Food Facts
            # Clean up the line for better search results (take first 2 non-numeric words)
            words = [w for w in line.split() if not w.isnumeric()]
            if not words:
                continue
            search_query = " ".join(words[:2])
            
            off_results = off_client.search_products_by_name(search_query, limit=1)
            if off_results:
                off_product = off_results[0]
                existing = product_service.get_product_by_barcode(db, off_product.barcode)
                if not existing:
                    try:
                        db_obj = Product(**off_product.dict())
                        db.add(db_obj)
                        db.commit()
                        db.refresh(db_obj)
                        matched_products.append(db_obj)
                    except Exception:
                        db.rollback()
                else:
                    matched_products.append(existing)
                    
    return text, matched_products
