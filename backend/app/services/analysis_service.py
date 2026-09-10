import os
import json
from sqlalchemy.orm import Session
from app.models.models import User, Receipt, ReceiptItem, Product
from datetime import datetime, timedelta, timezone
import google.generativeai as genai

# Realistic average serving sizes (grams) per food category
SERVING_SIZE_MAP = {
    "default": 150,
    "butter": 15,
    "cream": 30,
    "milk": 250,
    "cheese": 40,
    "tinned tuna": 100,
    "ham": 80,
    "sausage": 100,
    "steak": 200,
    "lamb": 200,
    "chicken": 200,
}

def estimate_serving_g(product_name: str) -> float:
    """Return a realistic serving size in grams for a given product."""
    name_lower = product_name.lower()
    for key, size in SERVING_SIZE_MAP.items():
        if key in name_lower:
            return size
    return SERVING_SIZE_MAP["default"]


def get_weekly_receipt_products(db: Session, user_id: int) -> list[dict]:
    """Get all unique products from the user's actual scanned receipt items in the last 7 days.
    Only returns products that are directly linked to a receipt item — never USDA seeded products."""
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    receipts = db.query(Receipt).filter(
        Receipt.user_id == user_id,
        Receipt.created_at >= seven_days_ago
    ).all()

    products = []
    seen_ids = set()
    for receipt in receipts:
        for item in receipt.items:
            if not item.product:
                continue
            if item.product.product_id in seen_ids:
                continue
            seen_ids.add(item.product.product_id)
            p = item.product
            # All DB values are per 100g — scale to a realistic serving size
            serving_g = estimate_serving_g(p.product_name)
            scale = serving_g / 100.0

            def s(val):
                return round((val or 0) * scale, 1)

            products.append({
                "product_id": p.product_id,
                "name": p.product_name,
                "serving_size_g": serving_g,
                "calories_per_serving": s(p.calories),
                "protein_g": s(p.protein),
                "fat_g": s(p.fat),
                "carbs_g": s(p.carbohydrates),
                "fiber_g": s(p.fiber),
                "sugar_g": s(p.sugar),
                "sodium_mg": s(p.sodium),
                "processing_level": p.processing_level or 1,
            })
    return products


def calculate_weekly_totals(products: list[dict]) -> dict:
    """Sum up realistic per-serving nutrition across all products for the week."""
    def total(key):
        return round(sum(p.get(key, 0) for p in products), 1)

    cals = total("calories_per_serving")
    fiber = total("fiber_g")
    protein = total("protein_g")
    sugar = total("sugar_g")
    sodium = total("sodium_mg")

    # Daily averages (divide by 7)
    daily_cals = round(cals / 7, 0)
    daily_fiber = round(fiber / 7, 1)

    return {
        "weekly_calories": cals,
        "weekly_protein_g": total("protein_g"),
        "weekly_fat_g": total("fat_g"),
        "weekly_carbs_g": total("carbs_g"),
        "weekly_fiber_g": fiber,
        "weekly_sugar_g": sugar,
        "weekly_sodium_mg": sodium,
        "daily_avg_calories": daily_cals,
        "daily_avg_fiber_g": daily_fiber,
        # Ratings based on WHO/NHS recommendations
        "fiber_rating": "High" if daily_fiber >= 30 else ("Adequate" if daily_fiber >= 20 else "Low"),
        "sugar_rating": "High" if sugar / 7 > 30 else ("Moderate" if sugar / 7 > 15 else "Low"),
        "protein_rating": "High" if protein / 7 > 100 else ("Adequate" if protein / 7 > 50 else "Low"),
        "sodium_rating": "High" if sodium / 7 > 2300 else ("Adequate" if sodium / 7 > 1500 else "Low"),
    }


async def generate_weekly_analysis(db: Session, user: User) -> dict:
    """Use Gemini to generate a full weekly gut health analysis based on REAL receipt data."""
    products = get_weekly_receipt_products(db, user.user_id)

    if not products:
        return {
            "has_data": False,
            "message": "No receipt data found for the past 7 days. Upload a receipt to get your personalised weekly analysis!"
        }

    totals = calculate_weekly_totals(products)
    product_detail_str = json.dumps(
        [{k: v for k, v in p.items() if k != "product_id"} for p in products],
        indent=2
    )

    prompt = f"""You are an expert gut health nutritionist. A user scanned their grocery receipts this week.

EXACT PRODUCTS PURCHASED ({len(products)} items, with realistic per-serving nutrition already calculated):
{product_detail_str}

CALCULATED WEEKLY NUTRITION TOTALS (already correctly computed from real serving sizes):
{json.dumps(totals, indent=2)}

Your job: generate a personalised gut health report based ONLY on these actual products. 
DO NOT invent products. Every item in food_categories must come from the product list above.
Every meal in the meal plan must use ingredients from the product list above.

Return ONLY valid JSON with no markdown fences, no extra text:

{{
  "has_data": true,
  "summary": "3-4 sentence personalised summary specifically referencing their actual food choices (use exact product names). Comment on their gut health outlook based on what they actually bought.",
  "food_categories": {{
    "good": [
      {{"name": "<exact product name from list>", "reason": "<specific gut benefit>"}}
    ],
    "moderate": [
      {{"name": "<exact product name from list>", "reason": "<why moderate for gut>"}}
    ],
    "bad": [
      {{"name": "<exact product name from list>", "reason": "<specific gut harm>"}}
    ]
  }},
  "alternatives": [
    {{"avoid": "<exact bad product name>", "swap_for": "<specific healthier food>", "benefit": "<gut microbiome benefit>"}}
  ],
  "meal_plan": {{
    "monday": {{"breakfast": "<meal using their products>", "lunch": "<meal>", "dinner": "<meal>", "snack": "<snack>"}},
    "tuesday": {{"breakfast": "<meal>", "lunch": "<meal>", "dinner": "<meal>", "snack": "<snack>"}},
    "wednesday": {{"breakfast": "<meal>", "lunch": "<meal>", "dinner": "<meal>", "snack": "<snack>"}},
    "thursday": {{"breakfast": "<meal>", "lunch": "<meal>", "dinner": "<meal>", "snack": "<snack>"}},
    "friday": {{"breakfast": "<meal>", "lunch": "<meal>", "dinner": "<meal>", "snack": "<snack>"}},
    "saturday": {{"breakfast": "<meal>", "lunch": "<meal>", "dinner": "<meal>", "snack": "<snack>"}},
    "sunday": {{"breakfast": "<meal>", "lunch": "<meal>", "dinner": "<meal>", "snack": "<snack>"}}
  }},
  "top_tips": [
    "<specific tip referencing one of their actual products>",
    "<specific tip referencing one of their actual products>",
    "<specific tip referencing one of their actual products>"
  ]
}}

Rules:
- EVERY product from the list must appear in exactly one of: good, moderate, or bad.
- Meal plan meals must reference actual products they bought (e.g. 'Grilled Chicken Breasts with Steamed Broccoli and Carrots').
- Tips must mention specific products by name, not generic advice.
- For alternatives, only list products categorised as 'bad'.
"""

    model = genai.GenerativeModel('gemini-3.6-flash')
    response = await model.generate_content_async(prompt)
    raw = response.text.replace('```json', '').replace('```', '').strip()

    try:
        result = json.loads(raw)
    except Exception:
        return {"has_data": False, "message": f"AI parse error. Raw: {raw[:300]}"}

    # Always inject real computed values — never trust Gemini's math
    result["weekly_nutrition"] = totals
    result["product_count"] = len(products)
    # Source-of-truth: names come from the DB, not Gemini's JSON
    result["products"] = [p["name"] for p in products]
    return result
