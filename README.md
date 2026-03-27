# A Microbial Soil Activity and Health Prediction System

<div align="center">
  <h3>Full-Stack Machine Learning System for Predicting Soil CO₂ Emissions and Overall Health</h3>
</div>

<br />

## 📝 Overview
This repository contains a complete end-to-end machine learning pipeline and interactive web dashboard designed to predict **Microbial Soil Activity** (specifically CO₂ emission levels) and assess overall **Soil Health**. 

By analyzing chemical and environmental datasets—such as pH, macronutrients, and microbial abundance—the system outputs a custom diagnostic score (0-100), visualizes the health profile via an interactive radar chart, and provides mathematically-backed, actionable management guidance.

## ✨ Key Features

### 1. Interactive UI Dashboard (`frontend/`)
*   **Dynamic Visualizations:** Includes a Chart.js Radar Chart mapping your specific soil profile against optimal ranges.
*   **Liebig's Law Bottleneck Analysis:** Automatically identifies and highlights the single critical limiting factor holding back your soil's biological potential.
*   **Explainable Actions:** Provides dynamic management solutions explicitly tailored to whether your parameters are too high or too low.
*   **Export:** Built-in "Download PDF" support for generating clean, printable diagnostic reports for farm managers.

### 2. Machine Learning API (`backend/`)
*   **Predictive Engine:** Uses a robust `LightGBM Regressor` trained on key soil indicators to predict actual biological flux ($CO_2$ Emission µg/g/day).
*   **Direct ML Explainability (SHAP):** The Flask API uses `shap.TreeExplainer` to calculate the exact mathematical impact (+/-) of every single feature in real-time, preventing the model from acting as a "black box".
*   **Advanced Feature Engineering:** Uses **Center Log-Ratio (CLR)** transformations to handle compositional microbiome data, along with Shannon Diversity Index, Species Richness, and Principal Component Analysis (PCA).

## 🚀 Getting Started

### Running the Full Web App Locally
To run the interactive dashboard and API on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/saket1432/soil-health-prediction-ml.git
    cd soil-health-prediction-ml
    ```
2.  **Install dependencies:**
    ```bash
    pip install pandas numpy scikit-learn lightgbm flask flask-cors shap
    ```
3.  **Launch the Backend API:**
    ```bash
    python3 backend/app.py
    ```
    *The API will start running on `http://127.0.0.1:5000`.*
4.  **Open the Dashboard:**
    Simply open the `frontend/index.html` file in any modern web browser to access the premium interactive UI.

---

### Exploring the Model Training (Google Colab)
If you only want to explore the data science and original model training process, you can launch the Jupyter Notebook directly in Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/saket1432/soil-health-prediction-ml/blob/main/soil_health_prediction.ipynb)

## 📊 Dataset
The mathematical models rely on the `Soil_microbe_dataset.csv`.
*   **Citation:** Kaggle, “Soil microbial activity dataset,” [Online]. Available: https://www.kaggle.com. Accessed: 2023.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
