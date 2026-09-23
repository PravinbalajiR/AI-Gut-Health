import pandas as pd
import numpy as np
import joblib
import argparse
import os
from feature_engineering import extract_features
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import json

def evaluate_model(model_path, data_path, output_json=None):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file {model_path} not found.")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data file {data_path} not found.")
        
    model = joblib.load(model_path)
    df = pd.read_csv(data_path)
    
    X = extract_features(df)
    y_true = df['gut_suitability_score']
    y_pred = model.predict(X)
    
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    results = {
        "model_version": os.path.basename(model_path),
        "dataset_size": len(df),
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4)
    }
    
    print("--- Model Evaluation ---")
    for k, v in results.items():
        print(f"{k}: {v}")
        
    if output_json:
        os.makedirs(os.path.dirname(output_json), exist_ok=True)
        with open(output_json, 'w') as f:
            json.dump(results, f, indent=4)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="../models/gut_suitability_v1.pkl")
    parser.add_argument("--data", type=str, default="../data/raw/dataset.csv")
    parser.add_argument("--output", type=str, default="../models/metrics.json")
    args = parser.parse_args()
    
    evaluate_model(args.model, args.data, args.output)
