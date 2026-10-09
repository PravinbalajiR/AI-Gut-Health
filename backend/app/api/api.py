from fastapi import APIRouter
from app.api.endpoints import auth, users, products, receipts, scores, assistant, shopping, admin, analysis
from app.api.endpoints import medical_profile, medical_records, symptoms, timeline, recommendations, food_diary

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(scores.router, prefix="/scores", tags=["scores"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
api_router.include_router(shopping.router, prefix="/shopping", tags=["shopping"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
# Medical Platform Routes
api_router.include_router(medical_profile.router, prefix="/medical-profile", tags=["medical-profile"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["medical-records"])
api_router.include_router(symptoms.router, prefix="/symptoms", tags=["symptoms"])
api_router.include_router(timeline.router, prefix="/timeline", tags=["timeline"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(food_diary.router, prefix="/food-diary", tags=["food-diary"])
