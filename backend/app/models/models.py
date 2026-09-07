from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    health_goal = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    receipts = relationship("Receipt", back_populates="user")
    diversity_scores = relationship("FoodDiversityScore", back_populates="user")
    ai_queries = relationship("AIQuery", back_populates="user")
    product_history = relationship("UserProductHistory", back_populates="user")

class Receipt(Base):
    __tablename__ = "receipts"
    receipt_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    store_name = Column(String)
    purchase_date = Column(Date)
    receipt_image_url = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="receipts")
    items = relationship("ReceiptItem", back_populates="receipt")

class ReceiptItem(Base):
    __tablename__ = "receipt_items"
    receipt_item_id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.receipt_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Integer)

    receipt = relationship("Receipt", back_populates="items")
    product = relationship("Product", back_populates="receipt_items")

class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String)
    brand = Column(String)
    category = Column(String)
    barcode = Column(String, index=True)
    calories = Column(Float)
    protein = Column(Float)
    fat = Column(Float)
    carbohydrates = Column(Float)
    fiber = Column(Float)
    sugar = Column(Float)
    sodium = Column(Float)
    processing_level = Column(String)
    source = Column(String)

    receipt_items = relationship("ReceiptItem", back_populates="product")
    product_ingredients = relationship("ProductIngredient", back_populates="product")
    gut_scores = relationship("GutScore", back_populates="product")
    user_history = relationship("UserProductHistory", back_populates="product")
    regional_variants = relationship("RegionalProduct", back_populates="product")

class Ingredient(Base):
    __tablename__ = "ingredients"
    ingredient_id = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String)
    description = Column(Text)
    regulatory_status = Column(String)
    evidence_summary = Column(Text)

    product_ingredients = relationship("ProductIngredient", back_populates="ingredient")

class ProductIngredient(Base):
    __tablename__ = "product_ingredients"
    product_id = Column(Integer, ForeignKey("products.product_id"), primary_key=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.ingredient_id"), primary_key=True)
    ingredient_order = Column(Integer)

    product = relationship("Product", back_populates="product_ingredients")
    ingredient = relationship("Ingredient", back_populates="product_ingredients")

class GutScore(Base):
    __tablename__ = "gut_scores"
    score_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"))
    fiber_score = Column(Float)
    processing_score = Column(Float)
    sugar_score = Column(Float)
    additive_score = Column(Float)
    diversity_score = Column(Float)
    final_gut_score = Column(Float)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="gut_scores")

class FoodDiversityScore(Base):
    __tablename__ = "food_diversity_scores"
    diversity_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    score = Column(Float)
    calculated_date = Column(Date)

    user = relationship("User", back_populates="diversity_scores")

class AIQuery(Base):
    __tablename__ = "ai_queries"
    query_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    question = Column(Text)
    response = Column(Text)
    asked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="ai_queries")

class UserProductHistory(Base):
    __tablename__ = "user_product_history"
    history_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    scan_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="product_history")
    product = relationship("Product", back_populates="user_history")

class RegionalProduct(Base):
    __tablename__ = "regional_products"
    regional_product_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"))
    region = Column(String)
    nutrition_notes = Column(Text)
    ingredient_notes = Column(Text)

    product = relationship("Product", back_populates="regional_variants")
