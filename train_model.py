import os
import pickle
from typing import List
from pathlib import Path
import pandas as pd
from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "grade_predictor")
COLLECTION = os.getenv("COLLECTION", "grades")
APP_DIR = Path(__file__).resolve().parent

CATEGORICAL = [
    "gender",
    "race",
    "parental level of education",
    "lunch",
    "test preparation course",
]
TARGETS = [
    "math score", "biology score", "physics score", "computer science score",
    "psychology score", "literature score", "economics score", "history score"
]

# User can set this to one of the remaining 8 subjects
TARGET_TO_PREDICT = os.getenv("TARGET_SUBJECT", "math score")
assert TARGET_TO_PREDICT in TARGETS, f"Invalid target: {TARGET_TO_PREDICT}"

# The other 7 scores are used as features
OTHER_SCORES = [s for s in TARGETS if s != TARGET_TO_PREDICT]

FEATURE_ORDER = CATEGORICAL + OTHER_SCORES

def main():
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI not set in .env file")

    client = MongoClient(MONGODB_URI)
    coll = client[DB_NAME][COLLECTION]
    projection = {k: 1 for k in CATEGORICAL + TARGETS}
    docs = list(coll.find({}, projection))

    if not docs:
        print("No documents found in MongoDB.")
        return

    df = pd.DataFrame(docs)
    if "_id" in df.columns:
        df.drop(columns=["_id"], inplace=True)

    missing = [c for c in CATEGORICAL + TARGETS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing fields in collection '{COLLECTION}': {missing}")

    # Clean & Encode
    for sc in TARGETS:
        df[sc] = pd.to_numeric(df[sc], errors="coerce")
    df.dropna(subset=CATEGORICAL + TARGETS, inplace=True)
    if df.empty:
        raise ValueError("After dropna the dataframe is empty. Check your data.")

    # One-hot encode categoricals
    ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    X_cat = ohe.fit_transform(df[CATEGORICAL])
    # Use the other 7 scores as features
    X_num = df[OTHER_SCORES].values
    X = np.hstack([X_cat, X_num])
    y = df[TARGET_TO_PREDICT].values

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print("X shape:", X_scaled.shape, "y shape:", y.shape)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    # Try different k values
    best_k = 5
    best_mae = float('inf')
    for k in range(3, 16):
        model = KNeighborsRegressor(n_neighbors=k, weights="distance")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        if mae < best_mae:
            best_mae = mae
            best_k = k
    print(f"Best k: {best_k} (MAE: {best_mae:.2f})")

    # Train final model
    model = KNeighborsRegressor(n_neighbors=best_k, weights="distance")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print("Final MAE:", mean_absolute_error(y_test, y_pred))
    print("Final R2:", r2_score(y_test, y_pred))

    # Calculate average grade for the target course
    avg_grade = np.mean(y_train)
    print(f"Average grade for {TARGET_TO_PREDICT}: {avg_grade:.2f}")

    # Save model, encoder, scaler, feature order, and average grade
    with open(APP_DIR / "model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(APP_DIR / "ohe.pkl", "wb") as f:
        pickle.dump(ohe, f)
    with open(APP_DIR / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open(APP_DIR / "feature_order.pkl", "wb") as f:
        pickle.dump(FEATURE_ORDER, f)
    with open(APP_DIR / "avg_grade.pkl", "wb") as f:
        pickle.dump(avg_grade, f)
    print("✅ Saved model, ohe, scaler, feature order, and average grade.")

if __name__ == "__main__":
    import numpy as np
    main()