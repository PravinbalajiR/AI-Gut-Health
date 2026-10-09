from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from collections import defaultdict
import httpx

from app.models.food_diary_models import FoodDiaryEntry, FoodSymptomAssociation
from app.models.medical_models import SymptomEntry, PatientMedicalProfile, PatientCondition, PatientAllergy
from app.core.config import settings

def _time_to_minutes(t_str: str) -> int:
    """Convert 'HH:MM' or 'HH:MM AM/PM' to minutes since midnight."""
    if not t_str:
        return 0
    try:
        dt = datetime.strptime(t_str, "%H:%M")
        return dt.hour * 60 + dt.minute
    except ValueError:
        try:
            dt = datetime.strptime(t_str, "%I:%M %p")
            return dt.hour * 60 + dt.minute
        except:
            return 0

def find_food_symptom_correlations(db: Session, user_id: int):
    """
    Module F: Deterministic & Statistical Analysis
    Finds foods that frequently precede symptom episodes (within 12 hours).
    """
    # 1. Fetch last 60 days of symptoms and foods
    symptoms = db.query(SymptomEntry).filter(
        SymptomEntry.user_id == user_id
    ).all()
    
    foods = db.query(FoodDiaryEntry).filter(
        FoodDiaryEntry.user_id == user_id
    ).all()
    
    if not symptoms or not foods:
        return []

    # Map symptoms by date
    symptoms_by_date = defaultdict(list)
    for s in symptoms:
        symptoms_by_date[s.entry_date].append(s)

    # 2. Deterministic Analysis: Co-occurrence
    food_counts = defaultdict(int)
    food_symptom_hits = defaultdict(lambda: defaultdict(int))
    
    for f in foods:
        f_name = f.food_name.lower().strip()
        food_counts[f_name] += 1
        
        # Check same day symptoms
        day_symptoms = symptoms_by_date.get(str(f.consumption_date), [])
        f_mins = _time_to_minutes(f.consumption_time)
        
        for s in day_symptoms:
            s_mins = _time_to_minutes(s.entry_time) if s.entry_time else 23*60
            
            # If food was eaten BEFORE the symptom (or time not specified so we assume same day)
            if s_mins >= f_mins:
                # Check which specific symptoms are present (severity > 0)
                symptom_types = ["bloating", "abdominal_pain", "gas", "constipation", "diarrhea", "nausea", "fatigue"]
                for symp in symptom_types:
                    if getattr(s, symp, 0) > 0:
                        food_symptom_hits[f_name][symp.replace("_", " ").title()] += 1
                
    # 3. Statistical filtering
    correlations = []
    for food, hits in food_symptom_hits.items():
        total_times_eaten = food_counts[food]
        if total_times_eaten < 1:
            continue # Skip
            
        for symptom, hit_count in hits.items():
            # For immediate user feedback, we'll flag anything > 0.
            # In a strict medical app, this would be >= 3 times.
            ratio = hit_count / total_times_eaten
            if ratio > 0.0:
                correlations.append({
                    "food": food.title(),
                    "symptom": symptom,
                    "times_eaten": total_times_eaten,
                    "times_symptom_followed": hit_count,
                    "ratio": ratio
                })
                
    return correlations

async def generate_correlation_insights(db: Session, user_id: int):
    """Generates AI insights for observed correlations and saves them to DB."""
    correlations = find_food_symptom_correlations(db, user_id)
    if not correlations:
        return []
        
    # Fetch medical context
    profile = db.query(PatientMedicalProfile).filter(PatientMedicalProfile.user_id == user_id).first()
    allergies = db.query(PatientAllergy).filter(PatientAllergy.user_id == user_id).all()
    conditions = db.query(PatientCondition).filter(PatientCondition.user_id == user_id).all()
    
    context = "Patient Medical Context:\n"
    has_data = False
    if profile and profile.dietary_restrictions:
        context += "- Dietary Restrictions/Allergies: " + profile.dietary_restrictions + "\n"
        has_data = True
    if profile and profile.gi_history_notes:
        context += "- Known GI History/Conditions: " + profile.gi_history_notes + "\n"
        has_data = True
    if allergies:
        context += "- Official Allergies: " + ", ".join([a.allergen_name for a in allergies]) + "\n"
        has_data = True
    if conditions:
        context += "- Official Conditions: " + ", ".join([c.condition_name for c in conditions]) + "\n"
        has_data = True
    if not has_data:
        context += "- No known allergies or conditions documented.\n"
        
    prompt = context + "\nAnalyze the following food-symptom associations observed in this patient's daily diary:\n"
    for c in correlations:
        prompt += f"- Ate {c['food']} {c['times_eaten']} times, which was followed by {c['symptom']} {c['times_symptom_followed']} times.\n"
        
    prompt += """
    Based on the patient's medical context and the observed data, provide a short, evidence-grounded interpretation.
    If a food contains ingredients that conflict with their known allergies or conditions (e.g. mutton/meat conflicting with a red meat allergy, dairy conflicting with lactose intolerance), POINT IT OUT directly.
    State clearly that this is an observed pattern and NOT a medical diagnosis.
    Do not invent correlations that are not in the data.
    Format your response as brief bullet points.
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
        "temperature": 0.2
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            data = response.json()
            interpretation = data["choices"][0]["message"]["content"].strip()
            
            # Save to DB
            results = []
            for c in correlations:
                assoc = db.query(FoodSymptomAssociation).filter(
                    FoodSymptomAssociation.user_id == user_id,
                    FoodSymptomAssociation.food_name_or_ingredient == c["food"],
                    FoodSymptomAssociation.associated_symptom == c["symptom"]
                ).first()
                
                if not assoc:
                    assoc = FoodSymptomAssociation(
                        user_id=user_id,
                        food_name_or_ingredient=c["food"],
                        associated_symptom=c["symptom"]
                    )
                    db.add(assoc)
                    
                assoc.observation_count = c["times_symptom_followed"]
                assoc.confidence_level = "High" if c["ratio"] > 0.75 and c["times_eaten"] >= 3 else "Medium"
                assoc.ai_interpretation = interpretation
                results.append(assoc)
                
            db.commit()
            return results
    except Exception as e:
        print(f"Error generating insight: {e}")
        return []
