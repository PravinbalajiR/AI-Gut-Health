from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class FoodDiaryEntry(Base):
    __tablename__ = "food_diary_entries"
    entry_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=True) # If linked to DB
    
    # Custom/Unlinked food data
    food_name = Column(String)
    meal_category = Column(String) # Breakfast, Lunch, Snack, Dinner
    
    quantity_consumed = Column(Float)
    serving_unit = Column(String) # e.g., 'grams', 'cups', 'items'
    
    # Nutrition snapshot (so historical records don't change if DB changes)
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    carbohydrates = Column(Float, nullable=True)
    fiber = Column(Float, nullable=True)
    sugar = Column(Float, nullable=True)
    sodium = Column(Float, nullable=True)
    
    # Metadata
    consumption_date = Column(Date, index=True)
    consumption_time = Column(String, nullable=True) # HH:MM format
    is_estimated = Column(Boolean, default=False)
    source_type = Column(String, default="manual") # manual, nlp, photo, receipt
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    product = relationship("Product")

class DailyNutritionSummary(Base):
    __tablename__ = "daily_nutrition_summaries"
    summary_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    summary_date = Column(Date, index=True)
    
    total_calories = Column(Float, default=0.0)
    total_protein = Column(Float, default=0.0)
    total_fat = Column(Float, default=0.0)
    total_carbs = Column(Float, default=0.0)
    total_fiber = Column(Float, default=0.0)
    total_sugar = Column(Float, default=0.0)
    
    water_intake_ml = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)
    
    last_calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class FoodSymptomAssociation(Base):
    __tablename__ = "food_symptom_associations"
    association_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    
    food_name_or_ingredient = Column(String)
    associated_symptom = Column(String) # e.g., 'Bloating', 'Pain'
    
    observation_count = Column(Integer, default=0)
    confidence_level = Column(String) # low, medium, high
    
    ai_interpretation = Column(Text)
    clinical_recommendation = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class MealRecommendation(Base):
    __tablename__ = "meal_recommendations"
    recommendation_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    
    meal_category = Column(String)
    suggested_food = Column(String)
    reasoning = Column(Text)
    nutrition_estimate_json = Column(Text)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
