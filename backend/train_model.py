import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
import lightgbm as lgb
import warnings

warnings.filterwarnings("ignore")

np.random.seed(42)

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

def main():
    print("Loading dataset...")
    # Go up one directory to find the dataset
    target_path = os.path.join(os.path.dirname(__file__), "..", "Soil_microbe_dataset.csv")
    df = pd.read_csv(target_path)
    
    # Preprocessing identical to notebook
    df = df.rename(columns={"NH4_Nitrate (µg/g)": "NH4_Ammonium (µg/g)"})
    
    def convert_range_to_mean(value):
        if isinstance(value, str) and ("-" in value or "–" in value):
            value = value.replace("–", "-")
            parts = value.split("-")
            try:
                nums = [float(p.strip()) for p in parts]
                return sum(nums) / len(nums)
            except:
                return np.nan
        return value

    df = df.apply(lambda col: col.map(convert_range_to_mean))
    
    target_col = "CO2_Emission (µg/g/day)"
    soil_cols = ["Soil_pH", "Soil_Depth_cm"]
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    exclude_cols = soil_cols + [target_col, "ID", "Organic_C (%)"]
    microbe_cols = [c for c in numeric_cols if c not in exclude_cols]
    
    X_raw = df[soil_cols + microbe_cols]
    y = df[target_col]
    
    print("Splitting data...")
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=42
    )

    print("Computing engineered features...")
    clr_train = clr_transform(X_train_raw[microbe_cols])
    shannon_train = shannon_index(X_train_raw[microbe_cols])
    rich_train = richness(X_train_raw[microbe_cols])
    
    print("Applying PCA...")
    pca = PCA(n_components=7)
    pca_train = pd.DataFrame(
        pca.fit_transform(clr_train),
        columns=[f"PCA_{i+1}" for i in range(7)],
        index=clr_train.index
    )

    X_train = pd.concat([
        X_train_raw[soil_cols],
        clr_train,
        pca_train,
        shannon_train,
        rich_train
    ], axis=1)

    final_feature_columns = list(X_train.columns)

    print("Imputing and scaling...")
    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    
    X_train = pd.DataFrame(imputer.fit_transform(X_train), columns=X_train.columns)
    X_train = pd.DataFrame(scaler.fit_transform(X_train), columns=X_train.columns)

    print("Training model...")
    model = lgb.LGBMRegressor(
        n_estimators=600,
        learning_rate=0.03,
        random_state=42
    )
    model.fit(X_train, y_train)

    print("Saving artifacts...")
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    joblib.dump(model, os.path.join(os.path.dirname(__file__), "model.joblib"))
    joblib.dump(scaler, os.path.join(os.path.dirname(__file__), "scaler.joblib"))
    joblib.dump(imputer, os.path.join(os.path.dirname(__file__), "imputer.joblib"))
    joblib.dump(pca, os.path.join(os.path.dirname(__file__), "pca.joblib"))
    joblib.dump({
        "final_feature_columns": final_feature_columns,
        "microbe_cols": microbe_cols,
        "soil_cols": soil_cols,
        "raw_columns": list(X_train_raw.columns)
    }, os.path.join(os.path.dirname(__file__), "meta.joblib"))
    
    joblib.dump([y_train.min(), y_train.max()], os.path.join(os.path.dirname(__file__), "target_bounds.joblib"))

    print("Done! Artifacts saved to backend directory.")

if __name__ == "__main__":
    main()
