import pandas as pd
from app.core.database import SessionLocal
from app.models.models import Product, GutScore
import os

def seed_database():
    db = SessionLocal()
    
    csv_path = "ml/data/processed/gut_health_master.csv"
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return
        
    print(f"Loading data from {csv_path} into SQLite database...")
    df = pd.read_csv(csv_path)
    
    # df = df.head(500) # Removed limit to load all
    
    added = 0
    for idx, row in df.iterrows():
        # Check if already exists
        existing = db.query(Product).filter(Product.product_name == str(row['food_name'])).first()
        if existing:
            continue
            
        product = Product(
            barcode=str(row['food_id']),
            product_name=str(row['food_name']),
            brand="USDA Database",
            category=str(row['category']),
            source=str(row['source']),
            calories=float(row['calories']),
            protein=float(row['protein']),
            carbohydrates=float(row['carbohydrates']),
            fat=float(row['fat']),
            fiber=float(row['fiber']),
            sugar=float(row['sugar']),
            sodium=float(row['sodium']),
            processing_level=str(int(row['processing_level']))
        )
        db.add(product)
        db.flush() # To get product_id
        
        # We don't pre-calculate the GutScore here. The API will calculate it dynamically 
        # using the ML model when the user clicks/searches it!
        
        added += 1
        
    db.commit()
    print(f"Successfully seeded {added} products into the SQLite database!")
    db.close()

if __name__ == "__main__":
    seed_database()
