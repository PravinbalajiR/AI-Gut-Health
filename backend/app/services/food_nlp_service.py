import json
import os
import httpx
from datetime import date
from typing import List
from app.schemas.food_diary import FoodDiaryEntryCreate
from app.core.config import settings

async def parse_food_text(text: str, target_date: date, ai_consent: bool) -> List[FoodDiaryEntryCreate]:
    """Uses LLM to extract food items from natural language text."""
    if not ai_consent:
        raise ValueError("AI processing consent required for natural language logging.")
        
    prompt = f"""
    You are an expert nutrition AI. Parse the following text and extract all food items consumed.
    Text: "{text}"
    Current Date: {target_date.isoformat()}
    
    Return a valid JSON array of objects. Each object must exactly match this structure:
    {{
      "food_name": "String (Name of the food)",
      "meal_category": "String (Must be exactly one of: Breakfast, Lunch, Snack, Dinner)",
      "quantity_consumed": float (e.g. 2.0, 1.5, 100.0),
      "serving_unit": "String (e.g. 'items', 'cups', 'grams', 'servings', 'slice')",
      "calories": float (YOU MUST ESTIMATE THIS based on standard nutrition data. DO NOT return null. E.g., 1 chapathi = 104.0, 1 serving paneer butter masala = 350.0),
      "protein": float (Estimate in grams, do not return null),
      "fat": float (Estimate in grams, do not return null),
      "carbohydrates": float (Estimate in grams, do not return null),
      "fiber": float (Estimate in grams, do not return null),
      "sugar": float (Estimate in grams, do not return null),
      "sodium": float (Estimate in mg, do not return null),
      "notes": "String (Any extra context, or empty string)"
    }}
    
    You must provide reasonable numeric estimates for ALL nutritional fields based on the portion size. DO NOT return null for macros or calories.
    Do not include markdown blocks or any other text. Return ONLY the raw JSON array.
    """
    
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "GutHealthAI",
    }
    
    payload = {
        "model": "qwen/qwen-2.5-72b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
    content = data["choices"][0]["message"]["content"].strip()
    
    if content.startswith("```json"):
        content = content[7:-3]
    elif content.startswith("```"):
        content = content[3:-3]
        
    try:
        parsed_items = json.loads(content)
        entries = []
        for item in parsed_items:
            item["consumption_date"] = target_date
            item["source_type"] = "nlp"
            entries.append(FoodDiaryEntryCreate(**item))
        return entries
    except Exception as e:
        raise ValueError(f"Failed to parse LLM response: {content}") from e
