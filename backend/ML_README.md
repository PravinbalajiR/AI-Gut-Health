# Machine Learning Intelligence Layer

## 1. Dataset Requirements
To train the Gut Suitability Model, supply a CSV dataset to `backend/ml/data/raw/dataset.csv`.
Required columns: `calories`, `protein`, `carbohydrates`, `fat`, `fiber`, `sugar`, `sodium`, `processing_level`.
Target column: `gut_suitability_score` (0-100).

## 2. Feature Definitions
- **Nutrition**: Standard macros (calories, fiber, sugar, sodium). Missing values are filled with 0.
- **Processing**: NOVA classification (1-4). Missing values default to 3.

## 3. Training Procedure
Run the following from the `backend/` directory:
```bash
python ml/src/train.py --data ml/data/raw/dataset.csv --model ml/models/gut_suitability_v1.pkl
```
The script will automatically perform feature extraction, handle train/test splitting (80/20) to prevent data leakage, and save the trained model.

## 4. Evaluation Procedure
Run:
```bash
python ml/src/evaluate.py --data ml/data/raw/dataset.csv --model ml/models/gut_suitability_v1.pkl --output ml/models/metrics.json
```
Metrics evaluated: MAE, RMSE, R².

## 5. Model Versioning
Models are saved as `.pkl` files with version identifiers (e.g., `gut_suitability_v1.pkl`). The inference service extracts the version from the filename and stores it with the prediction.

## 6. Inference Procedure
The model is loaded as a singleton in `ml/src/predict.py` (`GutHealthMLService`). It provides `predict_product(dict)` which returns the score, confidence, and SHAP-like explanations.

## 7. How to Retrain
Update the dataset in `ml/data/raw/dataset.csv` and re-run the training procedure. Restart the FastAPI server to load the new model into memory.

## 8. Known Limitations
- The current implementation uses a fallback mechanism if the model file is missing or corrupted.
- Explainability is currently based on heuristic analysis of the Random Forest's global feature importances applied to local node values, mimicking a simplified SHAP tree interpreter.

## 9. Data Leakage Considerations
- Train/Test splits use a fixed random state. 

## 10. Ethical/Safety Considerations
- The predictions are indicators, not clinical diagnoses.
- The AI Assistant is instructed to use cautious, evidence-based language ("may", "associated with") and explicitly forbidden from offering "cures."
