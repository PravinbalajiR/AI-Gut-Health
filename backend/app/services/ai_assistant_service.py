import os
import json
from sqlalchemy.orm import Session
from app.models.models import AIQuery, User, FoodDiversityScore, Receipt
from app.services.gut_score_service import calculate_user_diversity_score
from app.services.recommendation_service import get_full_patient_context
from openai import AsyncOpenAI
from datetime import datetime, timezone, timedelta

def get_structured_context(db: Session, user: User) -> str:
    """
    Gathers user data to build a highly structured JSON context for the LLM.
    """
    medical_context = get_full_patient_context(db, user.user_id)
    
    context_obj = {
        "user_profile": {
            "name": user.name or "Unknown",
            "health_goal": user.health_goal or "Not specified",
            "medical_and_clinical_history": medical_context
        },
        "food_diversity": {},
        "ml_intelligence_status": "Active (Gut Suitability v1 Model + Medical Context)"
    }
    
    # Get diversity score
    diversity = calculate_user_diversity_score(db, user.user_id)
    if diversity:
        context_obj["food_diversity"] = {
            "score": diversity.score,
            "target": 100,
            "meaning": "30+ unique plants/ingredients per week is optimal"
        }
        
    return json.dumps(context_obj, indent=2)

async def query_assistant(db: Session, user: User, question: str) -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return "I am unable to answer right now because the OPENROUTER_API_KEY is not configured in the backend environment. Please ask the developer to configure it!"
        
    structured_context = get_structured_context(db, user)
    
    system_instruction = (
        "You are the Gastrointestinal Intelligence Assistant. Your goal is to help the user understand their gut health based on their medical history, symptoms, and nutrition data.\n"
        "RULES:\n"
        "1. Never invent or fabricate medical facts, diagnoses, or clinical findings.\n"
        "2. Never claim to diagnose diseases or prescribe treatment.\n"
        "3. If symptoms suggest urgency (e.g., severe pain, bleeding), clearly state they must seek urgent medical care.\n"
        "4. For health-related questions, use this structure when appropriate:\n"
        "   - **What your records show:** (Summarize relevant documented facts)\n"
        "   - **Why this may matter:** (Explain relationships without claiming causation)\n"
        "   - **Personalized guidance:** (General dietary/lifestyle info)\n"
        "   - **What remains uncertain:** (Missing info)\n"
        "   - **Recommended next steps:** (Self-monitoring or clinician follow-up)\n"
        "   - **When to seek care:** (Warning signs)\n"
        "   - **Sources:** (Links/references to clinical guidelines if applicable)\n\n"
        f"--- STRUCTURED CLINICAL & NUTRITION DATA ---\n{structured_context}\n--- END DATA ---"
    )
    
    try:
        client = AsyncOpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1", default_headers={"HTTP-Referer": "http://localhost:5173", "X-Title": "Gut Health AI"})
        response = await client.chat.completions.create(
            model="qwen/qwen-2.5-7b-instruct",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": question}
            ]
        )
        answer = response.choices[0].message.content
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
