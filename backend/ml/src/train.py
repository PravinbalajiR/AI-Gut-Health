import pandas as pd
import numpy as np
import joblib
import os
import argparse
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from feature_engineering import extract_features
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def create_demo_data(output_path):
    """Creates a small demo dataset so the model can be trained even if no real dataset is provided."""
    print("Creating DEMO dataset...")
    data = {
        'product_name': ['Apple', 'Soda', 'Oats', 'White Bread', 'Kefir', 'Candy', 'Broccoli', 'Chips', 'Almonds', 'Donut'],
        'calories': [52, 140, 389, 265, 43, 400, 34, 536, 579, 452],
        'protein': [0.3, 0, 16.9, 9, 3.3, 0, 2.8, 7, 21.2, 5],
        'carbohydrates': [13.8, 39, 66.3, 49, 4.8, 98, 6.6, 53, 21.7, 51],
        'fat': [0.2, 0, 6.9, 3.2, 1, 0, 0.4, 35, 49.9, 25],
        'fiber': [2.4, 0, 10.6, 2.7, 0, 0, 2.6, 5, 12.5, 2],
        'sugar': [10.4, 39, 0, 5, 4, 98, 1.7, 0, 4.4, 27],
        'sodium': [1, 45, 2, 490, 40, 10, 33, 500, 1, 300],
        'processing_level': [1, 4, 1, 4, 2, 4, 1, 4, 1, 4],
        'gut_suitability_score': [95, 10, 92, 35, 88, 5, 98, 15, 90, 12] # Explicit labels
    }
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    return df

def train_model(data_path, model_output_path):
    if not os.path.exists(data_path):
        print(f"Data path {data_path} not found.")
        df = create_demo_data(data_path)
    else:
        df = pd.read_csv(data_path)
        
    print(f"Loaded dataset with {len(df)} records.")
    
    # 1. Feature Engineering
    X = extract_features(df)
    y = df['gut_suitability_score']
    
    # 2. Train-Test Split (Data Leakage Prevention)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Model Training
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # 4. Evaluation
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Model Evaluation ---")
    print(f"MAE:  {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²:   {r2:.2f}")
    
    # 5. Save Model
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)
    print(f"\nModel saved to {model_output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="../data/raw/dataset.csv")
    parser.add_argument("--model", type=str, default="../models/gut_suitability_v1.pkl")
    args = parser.parse_args()
    
    train_model(args.data, args.model)
