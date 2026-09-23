import pandas as pd
import numpy as np
import pdfplumber
import os
import re

def process_usda(limit=5000):
    print("Processing USDA Data (Subset)...")
    usda_dir = "../datasets/USDA/FoodData_Central_csv_2026-04-30"
    
    # 1. Load Foods
    food_df = pd.read_csv(os.path.join(usda_dir, "food.csv"), nrows=limit)
    
    # 2. Load Nutrients (we only want a few specific nutrients for ML)
    # 1003 = Protein, 1004 = Fat, 1005 = Carbs, 1079 = Fiber, 2000 = Sugar, 1093 = Sodium, 1008 = Calories
    target_nutrients = {1003: 'protein', 1004: 'fat', 1005: 'carbohydrates', 1079: 'fiber', 2000: 'sugar', 1093: 'sodium', 1008: 'calories'}
    
    # We read food_nutrient in chunks because it's massive
    nutrient_records = []
    chunk_size = 100000
    for chunk in pd.read_csv(os.path.join(usda_dir, "food_nutrient.csv"), chunksize=chunk_size):
        # Filter to our food subset and target nutrients
        subset = chunk[(chunk['fdc_id'].isin(food_df['fdc_id'])) & (chunk['nutrient_id'].isin(target_nutrients.keys()))]
        nutrient_records.append(subset)
        if len(pd.concat(nutrient_records)) > limit * 5: # Stop early for demo
            break
            
    nutrients_df = pd.concat(nutrient_records)
    
    # Pivot nutrients
    pivot_df = nutrients_df.pivot_table(index='fdc_id', columns='nutrient_id', values='amount', aggfunc='first').reset_index()
    pivot_df.rename(columns=target_nutrients, inplace=True)
    
    # Merge
    merged = pd.merge(food_df, pivot_df, on='fdc_id', how='inner')
    
    # Format
    clean_df = pd.DataFrame({
        'food_id': 'USDA_' + merged['fdc_id'].astype(str),
        'food_name': merged['description'],
        'source': 'USDA',
        'category': 'Unknown', # Could map from category table
        'calories': merged.get('calories', 0),
        'protein': merged.get('protein', 0),
        'fat': merged.get('fat', 0),
        'carbohydrates': merged.get('carbohydrates', 0),
        'fiber': merged.get('fiber', 0),
        'sugar': merged.get('sugar', 0),
        'sodium': merged.get('sodium', 0),
        'processing_level': 3 # Default assumption for USDA base foods
    })
    
    return clean_df.fillna(0)

def process_ifct():
    print("Processing IFCT Data (Subset from PDF)...")
    pdf_path = "../IFCT2017_16122024.pdf"
    records = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Just parse page 50 as a proof of concept extraction
            page = pdf.pages[50]
            text = page.extract_text()
            
            # Regex to match: E038 Mango, ripe... 3 88.04 0.46 0.38 0.54 ...
            # We are extracting approximate columns just to prove the pipeline works
            for line in text.split('\n'):
                match = re.match(r'([A-Z]\d{3})\s+(.*?)\s+(\d+)\s+([\d\.\]+)\s+([\d\.\]+)\s+([\d\.\]+)\s+([\d\.\]+)\s+([\d\.\]+)', line)
                if match:
                    code = match.group(1)
                    name = match.group(2)
                    protein = float(match.group(5).split('')[0]) if '' in match.group(5) else float(match.group(5))
                    fat = float(match.group(7).split('')[0]) if '' in match.group(7) else float(match.group(7))
                    carbs = float(match.group(8).split('')[0]) if '' in match.group(8) else float(match.group(8))
                    
                    records.append({
                        'food_id': 'IFCT_' + code,
                        'food_name': name,
                        'source': 'IFCT',
                        'category': 'Fruit',
                        'calories': (protein * 4) + (carbs * 4) + (fat * 9), # Approximation
                        'protein': protein,
                        'fat': fat,
                        'carbohydrates': carbs,
                        'fiber': 2.0, # Placeholder as it's further down the row
                        'sugar': carbs * 0.8, # Placeholder
                        'sodium': 5.0, # Placeholder
                        'processing_level': 1 # Whole fruit
                    })
    except Exception as e:
        print(f"IFCT Extraction Error: {e}")
        
    return pd.DataFrame(records)

def apply_weak_labels(df):
    """
    Evidence-Informed Weak Labeling System
    Creates a provisional 'gut_suitability_score' target.
    """
    print("Applying Provisional Gut Suitability Labels...")
    
    # Base score
    scores = np.full(len(df), 50.0)
    
    # Positive Evidence
    scores += df['fiber'] * 4.0 # High fiber is excellent for microbiome
    scores += df['protein'] * 0.5
    
    # Negative Evidence
    scores -= df['sugar'] * 1.5 # High sugar disrupts microbiome
    scores -= df['sodium'] * 0.02 # High sodium can indicate hyper-processing
    
    # Processing penalty
    processing_penalty = (df['processing_level'] - 1) * 10
    scores -= processing_penalty
    
    # Clamp 0-100
    df['gut_suitability_score'] = np.clip(scores, 0, 100)
    return df

if __name__ == "__main__":
    usda_df = process_usda(limit=2000)
    ifct_df = process_ifct()
    
    master_df = pd.concat([usda_df, ifct_df], ignore_index=True)
    master_df = apply_weak_labels(master_df)
    
    os.makedirs("ml/data/processed", exist_ok=True)
    out_path = "ml/data/processed/gut_health_master.csv"
    master_df.to_csv(out_path, index=False)
    print(f"Master Dataset created: {len(master_df)} rows saved to {out_path}")
