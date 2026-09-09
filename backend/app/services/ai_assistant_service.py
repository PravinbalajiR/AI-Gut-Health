import os
from sqlalchemy.orm import Session
from app.models.models import AIQuery, User, FoodDiversityScore, Receipt
from app.services.gut_score_service import calculate_user_diversity_score
import google.generativeai as genai
from datetime import datetime, timezone, timedelta

def get_user_context(db: Session, user: User) -> str:
    """
    Gathers user data to build a RAG context for the LLM.
    """
    context_lines = []
    context_lines.append(f"User Name: {user.name or 'Unknown'}")
    context_lines.append(f"Health Goal: {user.health_goal or 'Not specified'}")
    
    # Get diversity score
    diversity = calculate_user_diversity_score(db, user.user_id)
    if diversity:
        context_lines.append(f"Current Weekly Plant Diversity Score: {diversity.score}/100 (Target is 100, which means 30+ unique plants/ingredients).")
        
    # Get recent foods
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_receipts = db.query(Receipt).filter(Receipt.user_id == user.user_id, Receipt.created_at >= seven_days_ago).all()
    
    recent_foods = []
    for r in recent_receipts:
        for item in r.items:
            recent_foods.append(item.product.product_name)
            
    if recent_foods:
        context_lines.append(f"Recently consumed products in the last 7 days: {', '.join(set(recent_foods))}")
    else:
        context_lines.append("Recently consumed products: None recorded.")
        
    return "\n".join(context_lines)

def query_assistant(db: Session, user: User, question: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "I am unable to answer right now because the GEMINI_API_KEY is not configured in the backend environment. Please ask the developer to configure it!"
        
    genai.configure(api_key=api_key)
    
    context = get_user_context(db, user)
    
    system_instruction = (
        "You are the Gut Health AI Assistant. Your goal is to help the user improve their gut microbiome. "
        "Base your advice on their actual data provided below. "
        "Keep your answers concise, practical, and directly related to food diversity, processing levels, and fiber.\n\n"
        f"--- USER DATA ---\n{context}\n--- END USER DATA ---"
    )
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction)
        response = model.generate_content(question)
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
