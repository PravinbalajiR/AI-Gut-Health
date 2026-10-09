from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
load_dotenv()

from app.core.config import settings
from app.api.api import api_router
from app.core.database import engine
from app.models.models import Base
from app.models.medical_models import Base as MedicalBase
from app.models.food_diary_models import Base as FoodBase

# Auto-create tables for SQLite on startup
Base.metadata.create_all(bind=engine)
# MedicalBase and FoodBase should already share the same Base if they imported it correctly,
# but calling create_all multiple times is safe.
MedicalBase.metadata.create_all(bind=engine)
FoodBase.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok"}
