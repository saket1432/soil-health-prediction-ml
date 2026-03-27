import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import shap

app = Flask(__name__)
CORS(app)

# Load artifacts
backend_dir = os.path.dirname(__file__)
model = joblib.load(os.path.join(backend_dir, "model.joblib"))
explainer = shap.TreeExplainer(model)
scaler = joblib.load(os.path.join(backend_dir, "scaler.joblib"))
imputer = joblib.load(os.path.join(backend_dir, "imputer.joblib"))
pca = joblib.load(os.path.join(backend_dir, "pca.joblib"))
meta = joblib.load(os.path.join(backend_dir, "meta.joblib"))
target_bounds = joblib.load(os.path.join(backend_dir, "target_bounds.joblib"))

final_feature_columns = meta["final_feature_columns"]
microbe_cols = meta["microbe_cols"]
soil_cols = meta["soil_cols"]
raw_columns = meta["raw_columns"]
y_min, y_max = target_bounds

def clr_transform(df):
    arr = df.values + 1e-6
    props = arr / arr.sum(axis=1, keepdims=True)
    gm = np.exp(np.log(props).mean(axis=1, keepdims=True))
    clr = np.log(props / gm)
    return pd.DataFrame(clr, columns=df.columns, index=df.index)

def shannon_index(df):
    arr = df.values + 1e-12
    props = arr / arr.sum(axis=1, keepdims=True)
    return pd.Series(-(props * np.log(props)).sum(axis=1), name="Shannon", index=df.index)

def richness(df):
    return pd.Series((df.fillna(0) > 1e-6).sum(axis=1), name="Richness", index=df.index)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        # Convert dictionary to DataFrame
        sample_df = pd.DataFrame([data])
        
        # Ensure same raw feature order
        for col in raw_columns:
            if col not in sample_df.columns:
                sample_df[col] = 0.0 # fill missing
        sample_df = sample_df[raw_columns]

        # Feature Engineering
        clr_sample = clr_transform(sample_df[microbe_cols])
        shannon_sample = shannon_index(sample_df[microbe_cols])
        rich_sample = richness(sample_df[microbe_cols])

        pca_sample = pd.DataFrame(
            pca.transform(clr_sample),
            columns=[f"PCA_{i+1}" for i in range(pca.n_components_)],
            index=sample_df.index
        )

        final_sample_df = pd.concat([
            sample_df[soil_cols],
            clr_sample,
            pca_sample,
            shannon_sample,
            rich_sample
        ], axis=1)

        # Force same column order as training
        final_sample_reindexed = final_sample_df.reindex(columns=final_feature_columns)

        # Impute and Scale
        X_imputed = pd.DataFrame(imputer.transform(final_sample_reindexed), columns=final_feature_columns)
        X_scaled = pd.DataFrame(scaler.transform(X_imputed), columns=final_feature_columns)

        # Predict
        predicted_co2 = float(model.predict(X_scaled)[0])

        # Calculate exact SHAP values for explainability
        shap_vals = explainer.shap_values(X_scaled)[0]
        
        # Create a dictionary mapping feature names to their SHAP impact
        # Positive SHAP means it increased CO2 prediction (score). Negative means it decreased it.
        shap_impacts = [{"feature": feat, "impact": float(val)} for feat, val in zip(final_feature_columns, shap_vals) if abs(val) > 0.01]
        
        # Sort by absolute impact to find the biggest drivers
        shap_impacts = sorted(shap_impacts, key=lambda x: abs(x["impact"]), reverse=True)

        # Normalize score
        score = 100 * (predicted_co2 - y_min) / (y_max - y_min)
        score = max(0, min(100, float(score)))

        # Categorize
        if score >= 75:
            category = "Excellent"
            risk = "Low Risk"
            sustainability = "Biologically Sustainable"
            actions = ["Maintain current soil management practices.", "Avoid excessive chemical disturbance."]
        elif score >= 50:
            category = "Good"
            risk = "Mild Risk"
            sustainability = "Stable but Monitoring Recommended"
            actions = ["Continue organic amendments.", "Monitor nutrient balance."]
        elif score >= 30:
            category = "Moderate"
            risk = "Moderate Risk"
            sustainability = "Needs Biological Improvement"
            actions = ["Increase compost application.", "Improve soil moisture retention."]
        else:
            category = "Poor"
            risk = "High Risk"
            sustainability = "Restoration Required"
            actions = ["Add organic carbon sources.", "Reduce intensive tillage.", "Consider crop rotation."]

        return jsonify({
            "co2_emission": predicted_co2,
            "score": score,
            "category": category,
            "risk": risk,
            "sustainability": sustainability,
            "management_guidance": actions,
            "shap_impacts": shap_impacts
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5000)
