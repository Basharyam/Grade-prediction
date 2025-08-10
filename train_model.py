# train_model.py
import os
import pickle
from typing import List
from pathlib import Path

import pandas as pd
from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
from dotenv import load_dotenv

# -------- Load .env --------
load_dotenv()  # טוען MONGODB_URI, DB_NAME, COLLECTION

# -------- CONFIG --------
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME     = os.getenv("DB_NAME", "grade_predictor")
COLLECTION  = os.getenv("COLLECTION", "grades")

# נשמור את המודל באותה תיקייה של הסקריפט (כלומר ליד app.py אם שניהם יחד)
APP_DIR = Path(__file__).resolve().parent

FEATURE_ORDER: List[str] = [
    "gender",
    "race",
    "parental level of education",
    "lunch",
    "test preparation course",
    "math score",
    "reading score",
    "writing score",
]
CATEGORICAL = FEATURE_ORDER[:5]
TARGETS     = ["math score", "reading score", "writing score"]  # סדר חשוב!

def main():
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI not set in .env file")

    # 1) Load from MongoDB (רק העמודות שאנחנו צריכים)
    client = MongoClient(MONGODB_URI)
    coll = client[DB_NAME][COLLECTION]
    projection = {k: 1 for k in FEATURE_ORDER}
    docs = list(coll.find({}, projection))

    if not docs:
        print("No documents found in MongoDB.")
        return

    df = pd.DataFrame(docs)
    if "_id" in df.columns:
        df.drop(columns=["_id"], inplace=True)

    missing = [c for c in FEATURE_ORDER if c not in df.columns]
    if missing:
        raise ValueError(f"Missing fields in collection '{COLLECTION}': {missing}")

    # 2) Clean & Encode
    for sc in TARGETS:
        df[sc] = pd.to_numeric(df[sc], errors="coerce")
    df.dropna(subset=CATEGORICAL + TARGETS, inplace=True)

    if df.empty:
        raise ValueError("After dropna the dataframe is empty. Check your data.")

    encoders = {}
    for col in CATEGORICAL:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le  # המפתחות נשמרים בדיוק כמו ש-app.py מצפה

    # 3) Train (8 פיצ'רים → 3 יעדים)
    X = df[FEATURE_ORDER].values
    y = df[TARGETS].values

    print("X shape:", X.shape, "y shape:", y.shape)  # צריך להיות (N, 8) ו-(N, 3)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = KNeighborsRegressor(n_neighbors=5, weights="distance")
    model.fit(X_train, y_train)

    # 4) Metrics
    y_pred = model.predict(X_test)
    mae = [mean_absolute_error(y_test[:, i], y_pred[:, i]) for i in range(3)]
    r2  = [r2_score(y_test[:, i], y_pred[:, i]) for i in range(3)]
    print("MAE [Math, Reading, Writing]:", [round(v, 3) for v in mae])
    print("R2  [Math, Reading, Writing]:", [round(v, 3) for v in r2])

    # 5) Save atomically next to app.py/train_model.py
    tmp_model = APP_DIR / "model.tmp.pkl"
    tmp_enc   = APP_DIR / "encoders.tmp.pkl"
    with open(tmp_model, "wb") as f:
        pickle.dump(model, f)
    with open(tmp_enc, "wb") as f:
        pickle.dump(encoders, f)

    # אימות חד-משמעי: המודל חייב להיות על 8 פיצ'רים
    nfi = getattr(model, "n_features_in_", None)
    print("n_features_in_ (trained):", nfi)
    assert nfi == 8, "Model is not trained on 8 features! Check FEATURE_ORDER/X."

    # החלפת קבצים ישנים בשם הסופי
    (tmp_model).replace(APP_DIR / "model.pkl")
    (tmp_enc).replace(APP_DIR / "encoders.pkl")

    print("✅ Saved:", APP_DIR / "model.pkl")
    print("✅ Saved:", APP_DIR / "encoders.pkl")

if __name__ == "__main__":
    main()
