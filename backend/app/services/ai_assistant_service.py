import os
import json
from sqlalchemy.orm import Session
from app.models.models import AIQuery, User, FoodDiversityScore, Receipt
from app.services.gut_score_service import calculate_user_diversity_score
import google.generativeai as genai
from datetime import datetime, timezone, timedelta

def get_structured_context(db: Session, user: User) -> str:
    """
    Gathers user data to build a highly structured JSON context for the LLM.
    """
    context_obj = {
        "user_profile": {
            "name": user.name or "Unknown",
            "health_goal": user.health_goal or "Not specified"
        },
        "food_diversity": {},
        "recent_foods": [],
        "ml_intelligence_status": "Active (Gut Suitability v1 Model Loaded)"
    }
    
    # Get diversity score
    diversity = calculate_user_diversity_score(db, user.user_id)
    if diversity:
        context_obj["food_diversity"] = {
            "score": diversity.score,
            "target": 100,
            "meaning": "30+ unique plants/ingredients per week is optimal"
        }
        
    # Get recent foods
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_receipts = db.query(Receipt).filter(Receipt.user_id == user.user_id, Receipt.created_at >= seven_days_ago).all()
    
    recent_foods = []
    for r in recent_receipts:
        for item in r.items:
            recent_foods.append(item.product.product_name)
            
    if recent_foods:
        context_obj["recent_foods"] = list(set(recent_foods))
        
    return json.dumps(context_obj, indent=2)

async def query_assistant(db: Session, user: User, question: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "I am unable to answer right now because the GEMINI_API_KEY is not configured in the backend environment. Please ask the developer to configure it!"
        
    structured_context = get_structured_context(db, user)
    
    system_instruction = (
        "You are the Gut Health AI Assistant. Your goal is to help the user improve their gut microbiome. "
        "Base your advice on their actual structured data provided below. "
        "You must explain concepts clearly but use medical/nutrition safety language (e.g. 'may', 'evidence suggests'). "
        "Never invent medical facts or claim a food will 'cure' a disease.\n\n"
        f"--- STRUCTURED USER DATA ---\n{structured_context}\n--- END USER DATA ---"
    )
    
    try:
        model = genai.GenerativeModel('gemini-3.6-flash', system_instruction=system_instruction)
        response = await model.generate_content_async(question)
        answer = response.text
    except Exception as e:
        answer = f"Sorry, I encountered an error communicating with the AI service: {str(e)}"
        
    # Save the query history
    ai_query = AIQuery(
        user_id=user.user_id,
        question=question,
        response=answer
    )
    db.add(ai_query)
    db.commit()
    
    return answer
