# A Microbial Soil Activity and Health Prediction System

<div align="center">
  <h3>Machine Learning System for Predicting Soil CO₂ Emissions and Overall Health</h3>
</div>

<br />

## 📝 Overview
This repository contains a machine learning pipeline designed to predict **Microbial Soil Activity** (specifically CO₂ emission levels) and assess overall **Soil Health**. By analyzing chemical and environmental datasets—such as pH, macronutrients, and microbial abundance—the system outputs a diagnostic score (0-100) and provides actionable management guidance.

This project demonstrates the application of predictive modeling in data-driven agriculture and environmental science.

## 📊 Dataset
The data used to train this model was sourced from Kaggle.
*   **Citation:** Kaggle, “Soil microbial activity dataset,” [Online]. Available: https://www.kaggle.com. Accessed: 2023.
*   **Data Structure:** The dataset contains environmental features (like `Soil_pH` and `Soil_Depth_cm`), macronutrient profiles (Nitrogen, Carbon), and microbial abundance markers.
*   **Target:** The model is trained to predict `CO2_Emission (µg/g/day)` as a proxy for overall biological soil activity.

> **Note:** To run this notebook locally or in Colab, you will need to upload your own copy of the dataset (e.g., `Soil_microbe_dataset.csv`).

## ✨ Key Features
*   **Predictive Modeling:** Utilizes a `LightGBM Regressor` trained on key soil indicators to predict microbial respiration ($CO_2$ Emission µg/g/day) with high accuracy.
*   **Feature Engineering:** Includes advanced composition transformations, such as **Center Log-Ratio (CLR)** for microbial abundance, alongside Shannon Diversity Index and Species Richness calculations.
*   **Dimensionality Reduction:** Employs **Principal Component Analysis (PCA)** to manage high-dimensional microbial composition data.
*   **Diagnostic Reporting:** Outputs a comprehensive "Microbial Soil Health Report," categorizing soil into *Excellent, Good, Moderate,* or *Poor* health, complete with customized sustainability and management guidance.

## 🛠️ Technologies Used
*   **Language:** Python 3
*   **Core Libraries:** `pandas`, `numpy`
*   **Machine Learning:** `scikit-learn` (PCA, Custom Imputation, StandardScaling, Cross-Validation), `lightgbm`
*   **Environment:** Google Colab / Jupyter Notebook

## 🚀 Getting Started

### Running in Google Colab (Recommended)
The easiest way to explore this project is to open the notebook directly in Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/saket1432/soil-health-prediction-ml/blob/main/soil_health_prediction.ipynb)

### Running Locally
To run this project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/saket1432/soil-health-prediction-ml.git
    cd soil-health-prediction-ml
    ```
2.  **Install dependencies:**
    ```bash
    pip install pandas numpy scikit-learn lightgbm
    ```
3.  **Launch Jupyter Notebook:**
    ```bash
    jupyter notebook soil_health_prediction.ipynb
    ```

## 📊 Methodology Snapshot
1.  **Data Preprocessing:** Standardized chemical markers and converted string-based range values to numerical means. Targeted exclusions (like direct Organic C percentage) were made during correlation analysis.
2.  **Transformation:** Microbial percentage data was transformed using CLR to account for compositionality constraints.
3.  **Modeling:** An LGBM Regressor (`n_estimators=600`, `learning_rate=0.03`) was validated using 5-Fold Cross-Validation.
4.  **Inference:** New soil samples are dynamically scaled and imputed based on the training distribution before prediction.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
