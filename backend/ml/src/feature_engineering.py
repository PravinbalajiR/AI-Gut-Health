import pandas as pd
import numpy as np

def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts and standardizes features from raw product data for ML prediction.
    Features:
    - Nutrition: calories, protein, carbohydrates, fat, fiber, sugar, sodium
    - Processing: processing_level (numeric)
    """
    features = pd.DataFrame()
    
    # Nutrition features (handle missing values gracefully)
    features['calories'] = pd.to_numeric(df.get('calories'), errors='coerce').fillna(0)
    features['protein'] = pd.to_numeric(df.get('protein'), errors='coerce').fillna(0)
    features['carbohydrates'] = pd.to_numeric(df.get('carbohydrates'), errors='coerce').fillna(0)
    features['fat'] = pd.to_numeric(df.get('fat'), errors='coerce').fillna(0)
    features['fiber'] = pd.to_numeric(df.get('fiber'), errors='coerce').fillna(0)
    features['sugar'] = pd.to_numeric(df.get('sugar'), errors='coerce').fillna(0)
    features['sodium'] = pd.to_numeric(df.get('sodium'), errors='coerce').fillna(0)
    
    # Processing level (NOVA 1-4, default to 3 if unknown)
    def parse_nova(val):
        try:
            val = float(val)
            if np.isnan(val): return 3.0
            return val
        except:
            return 3.0
            
    features['processing_level'] = df.get('processing_level', 3).apply(parse_nova)
    
    return features
