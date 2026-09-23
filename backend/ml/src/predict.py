import pandas as pd
import joblib
import os
import sys

# Ensure backend root is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from ml.src.feature_engineering import extract_features

class GutHealthMLService:
    def __init__(self, model_path="ml/models/gut_suitability_v3.pkl"):
        # We assume this runs from backend root
        self.model_path = model_path
        self.model = None
        self.model_version = os.path.basename(model_path).replace('.pkl', '')
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            self.is_available = True
        else:
            self.model = None
            self.is_available = False

    def predict_product(self, product_dict: dict) -> dict:
        """
        Returns prediction dictionary.
        Returns None if model is unavailable (fallback should be used).
        """
        if not self.is_available:
            return None
            
        df = pd.DataFrame([product_dict])
        X = extract_features(df)
        
        # Predict score
        score = self.model.predict(X)[0]
        # Ensure bounds 0-100
        score = max(0.0, min(100.0, float(score)))
        
        # Confidence: for a Random Forest, we can use the standard deviation of trees as inverse uncertainty
        preds = [tree.predict(X.values)[0] for tree in self.model.estimators_]
        std = pd.Series(preds).std()
        # Scale std to a mock confidence 0-1
        confidence = max(0.1, min(0.99, 1.0 - (std / 50.0)))
        
        # Explainability (pseudo-SHAP using feature importances)
        # We calculate deviation from mean and multiply by global feature importance
        importances = self.model.feature_importances_
        feature_names = X.columns
        
        # Very simple heuristic explainability for demonstration:
        # High fiber -> positive, High processing -> negative
        explanations = []
        val = X.iloc[0]
        
        if val['fiber'] > 5:
            explanations.append({"factor": "Fiber", "impact": "positive", "reason": "High fiber content"})
        elif val['fiber'] < 2:
            explanations.append({"factor": "Fiber", "impact": "negative", "reason": "Low fiber content"})
            
        if val['processing_level'] >= 4:
            explanations.append({"factor": "Processing", "impact": "negative", "reason": "Ultra-processed (NOVA 4)"})
        elif val['processing_level'] <= 2:
            explanations.append({"factor": "Processing", "impact": "positive", "reason": "Unprocessed/Minimally processed"})
            
        if val['sugar'] > 15:
            explanations.append({"factor": "Sugar", "impact": "negative", "reason": "High sugar content"})
            
        if val['sodium'] > 400:
            explanations.append({"factor": "Sodium", "impact": "negative", "reason": "High sodium content"})
            
        positive_factors = [e['reason'] for e in explanations if e['impact'] == 'positive']
        negative_factors = [e['reason'] for e in explanations if e['impact'] == 'negative']

        return {
            "gut_suitability_score": round(float(score), 1),
            "confidence": float(confidence),
            "model_version": self.model_version,
            "top_positive_factors": positive_factors,
            "top_negative_factors": negative_factors,
            "explanations": explanations
        }

# Singleton instance
ml_service = GutHealthMLService()
