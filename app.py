# app.py  (unified)
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import pickle

app = Flask(__name__)
CORS(app)

# -------------------- Load model & encoders --------------------
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ENCS_PATH  = os.path.join(BASE_DIR, "encoders.pkl")

print(">> Loading model from:", MODEL_PATH)
print(">> Loading encoders from:", ENCS_PATH)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"model.pkl not found at {MODEL_PATH}")
if not os.path.exists(ENCS_PATH):
    raise FileNotFoundError(f"encoders.pkl not found at {ENCS_PATH}")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)
with open(ENCS_PATH, "rb") as f:
    encoders = pickle.load(f)

nfi = getattr(model, "n_features_in_", None)
print(">> Loaded model n_features_in_:", nfi)

# API builds 8 features (5 categorical + 3 scores) → model must match
if nfi != 8:
    raise RuntimeError(
        f"Model was trained for {nfi} features, but API builds 8. "
        f"Retrain to multi-output with 8 features or replace model.pkl."
    )

# -------------------- Constants --------------------
FEATURE_ORDER = [
    "gender",
    "race",
    "parental level of education",
    "lunch",
    "test preparation course",
    "math score",
    "reading score",
    "writing score",
]

# -------------------- Helpers --------------------
def safe_encode(le, value):
    """Encode with LabelEncoder; unseen values fall back to first class."""
    try:
        return int(le.transform([value])[0])
    except Exception:
        return int(le.transform([le.classes_[0]])[0])

def to_letter_grade(avg):
    if avg >= 90: return "A"
    if avg >= 80: return "B"
    if avg >= 70: return "C"
    if avg >= 60: return "D"
    return "F"

def predict_core(data):
    # normalize some frontend values to match training text exactly
    genders  = {"male": "male", "female": "female"}
    testprep = {"completed": "completed", "none": "none"}

    row = {
        "gender": genders.get(str(data.get("gender", "")).lower(), str(data.get("gender", ""))),
        "race": data.get("race", ""),
        "parental level of education": data.get("parental_level_of_education", ""),
        "lunch": data.get("lunch", ""),
        "test preparation course": testprep.get(
            str(data.get("test_preparation_course", "")).lower(),
            str(data.get("test_preparation_course", ""))
        ),
        "math score": float(data.get("math_score", 0)),
        "reading score": float(data.get("reading_score", 0)),
        "writing score": float(data.get("writing_score", 0)),
    }

    # encode categoricals exactly like training
    try:
        g  = safe_encode(encoders["gender"], row["gender"])
        r  = safe_encode(encoders["race"], row["race"])
        pe = safe_encode(encoders["parental level of education"], row["parental level of education"])
        l  = safe_encode(encoders["lunch"], row["lunch"])
        tp = safe_encode(encoders["test preparation course"], row["test preparation course"])
    except KeyError as ke:
        raise KeyError(f"Missing encoder for: {ke}. Available: {list(encoders.keys())}")

    # build feature vector (same order as training)
    x_row = [g, r, pe, l, tp, row["math score"], row["reading score"], row["writing score"]]
    X_np = np.array([x_row], dtype=float)  # shape: (1, 8)

    # predict the three scores (multi-output KNN)
    y_pred = model.predict(X_np)  # shape: (1, 3)
    math_p, read_p, write_p = [float(v) for v in y_pred[0]]
    avg_pred = (math_p + read_p + write_p) / 3.0

    # letter + simple confidence from neighbor distances (if available)
    letter = to_letter_grade(avg_pred)
    try:
        distances, _ = model.kneighbors(X_np, n_neighbors=model.n_neighbors)
        confidence = 1.0 / (1.0 + float(np.mean(distances)))
    except Exception:
        confidence = 0.6

    return {
        "success": True,
        "prediction": letter,
        "predicted_scores": {
            "math": round(math_p, 1),
            "reading": round(read_p, 1),
            "writing": round(write_p, 1),
            "average": round(avg_pred, 1),
        },
        "confidence": round(confidence, 3),
        "message": "Prediction generated successfully",
    }

# -------------------- Routes --------------------
@app.post("/api/predict")
def api_predict():
    try:
        data = request.get_json(force=True)
        return jsonify(predict_core(data))
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Alias (if you call without the Node proxy)
@app.post("/predict")
def bare_predict():
    return api_predict()

@app.get("/health")
def health():
    return {"ok": True}

# Small debug endpoint to verify loaded artifacts
@app.get("/debug/model")
def debug_model():
    return {
        "n_features_in_": getattr(model, "n_features_in_", None),
        "encoders_keys": sorted(list(encoders.keys()))
    }

# -------------------- Main --------------------
if __name__ == "__main__":
    # run on 5001 to match your Node proxy
    app.run(host="0.0.0.0", port=5001, debug=True)
