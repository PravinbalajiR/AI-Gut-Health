import os
import json
from sqlalchemy.orm import Session
from app.models.models import User, Receipt
from app.models.medical_models import ClinicalRecommendation, PatientMedicalProfile, PatientCondition, PatientAllergy, PatientMedication, SymptomEntry, LabResult
from openai import AsyncOpenAI
from datetime import datetime, timezone, timedelta

def get_full_patient_context(db: Session, user_id: int) -> dict:
    profile = db.query(PatientMedicalProfile).filter(PatientMedicalProfile.user_id == user_id).first()
    conditions = db.query(PatientCondition).filter(PatientCondition.user_id == user_id, PatientCondition.status == 'active').all()
    allergies = db.query(PatientAllergy).filter(PatientAllergy.user_id == user_id).all()
    meds = db.query(PatientMedication).filter(PatientMedication.user_id == user_id, PatientMedication.is_active == 1).all()
    symptoms = db.query(SymptomEntry).filter(SymptomEntry.user_id == user_id).order_by(SymptomEntry.entry_date.desc()).limit(7).all()
    labs = db.query(LabResult).filter(LabResult.user_id == user_id).order_by(LabResult.created_at.desc()).limit(10).all()
    
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_receipts = db.query(Receipt).filter(Receipt.user_id == user_id, Receipt.created_at >= seven_days_ago).all()
    recent_foods = []
    for r in recent_receipts:
        for i in r.items:
            recent_foods.append(i.product.product_name)
    
    return {
        "profile": {
            "dietary_preference": profile.dietary_preference if profile else None,
            "restrictions": profile.dietary_restrictions if profile else None,
        },
        "active_conditions": [c.condition_name for c in conditions],
        "allergies": [a.allergen_name for a in allergies],
        "medications": [m.medication_name for m in meds],
        "recent_symptoms": [{"date": s.entry_date, "severity": s.severity_overall, "bloating": s.bloating, "pain": s.abdominal_pain} for s in symptoms],
        "recent_labs": [{"test": l.test_name, "value": l.test_value, "status": l.result_status} for l in labs],
        "recent_foods_purchased": list(set(recent_foods))
    }

async def generate_clinical_recommendations(db: Session, user: User) -> list:
    # Clear old recommendations
    db.query(ClinicalRecommendation).filter(ClinicalRecommendation.user_id == user.user_id).delete()
    
    context = get_full_patient_context(db, user.user_id)
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return []
        
    prompt = f"""
    You are an expert gastroenterologist and clinical dietician.
    Based on the patient's comprehensive data below, generate 3-5 personalized gut health recommendations.
    
    PATIENT CONTEXT:
    {json.dumps(context, indent=2)}
    
    RULES:
    - Never diagnose diseases or prescribe treatments.
    - Base recommendations on reputable medical guidelines (NIDDK, WHO, NHS).
    - If symptoms are severe (pain > 7, etc.), issue an urgent clinical follow-up recommendation.
    - Focus on dietary adjustments, symptom tracking, hydration, and questions to ask their doctor.
    
    Return ONLY a JSON array of objects with the exact keys:
    [
      {{
        "recommendation_text": "The core advice",
        "reasoning": "Why this is recommended based on their data",
        "category": "dietary|lifestyle|clinical|urgent",
        "evidence_references": "e.g., 'NHS Guidelines for IBS'",
        "limitations": "e.g., 'Requires clinical evaluation to confirm'",
        "is_urgent": 0 or 1
      }}
    ]
    """
    
    client = AsyncOpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
    try:
        response = await client.chat.completions.create(
            model="qwen/qwen-2.5-7b-instruct",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.choices[0].message.content.replace('```json', '').replace('```', '').strip()
        recs = json.loads(raw)
        
        db_recs = []
        for r in recs:
            rec = ClinicalRecommendation(
                user_id=user.user_id,
                recommendation_text=r["recommendation_text"],
                reasoning=r.get("reasoning"),
                category=r.get("category"),
                evidence_references=r.get("evidence_references"),
                limitations=r.get("limitations"),
                patient_data_used=json.dumps(context),
                is_urgent=r.get("is_urgent", 0)
            )
            db.add(rec)
            db_recs.append(rec)
        db.commit()
        return db_recs
        
    except Exception as e:
        print(f"Failed to generate recommendations: {e}")
        return []
