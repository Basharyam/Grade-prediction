# app.py (unified)
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import numpy as np
import pickle
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
OHE_PATH = os.path.join(BASE_DIR, "ohe.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")
FEAT_PATH = os.path.join(BASE_DIR, "feature_order.pkl")

if not (os.path.exists(MODEL_PATH) and os.path.exists(OHE_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(FEAT_PATH)):
    raise FileNotFoundError("Model, encoder, scaler, or feature order file missing.")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)
with open(OHE_PATH, "rb") as f:
    ohe = pickle.load(f)
with open(SCALER_PATH, "rb") as f:
    scaler = pickle.load(f)
with open(FEAT_PATH, "rb") as f:
    FEATURE_ORDER = pickle.load(f)

CATEGORICAL = FEATURE_ORDER[:5]
TARGETS = [
    "math score", "biology score", "physics score", "computer science score",
    "psychology score", "literature score", "economics score", "history score"
]
latest_neighbors_result = None

def score_to_grade(score):
    if score >= 90: return "A", "Excellent work! Keep it up!"
    elif score >= 80: return "B", "Good job! Consider refining your skills."
    elif score >= 70: return "C", "Satisfactory, but room for improvement."
    elif score >= 60: return "D", "Passing, but focus on strengthening this area."
    else: return "F", "Failed. Please review and seek support."

@app.post("/api/predict")
def api_predict():
    global latest_neighbors_result
    try:
        data = request.get_json(force=True)
        target = data.get("target_subject")
        if not target or target not in TARGETS:
            return jsonify({"success": False, "error": f"Invalid or missing target_subject: {target}"}), 400
        other_scores = [s for s in TARGETS if s != target]
        # Validate input
        for cat in CATEGORICAL:
            if cat.replace(" ", "_") not in data and cat not in data:
                return jsonify({"success": False, "error": f"Missing field: {cat}"}), 400
        for score in TARGETS:
            if score.replace(" ", "_") not in data and score not in data:
                return jsonify({"success": False, "error": f"Missing field: {score}"}), 400
        # Build input row
        row = []
        for cat in CATEGORICAL:
            val = data.get(cat.replace(" ", "_"), data.get(cat, ""))
            row.append(val)
        for score in TARGETS:
            val = float(data.get(score.replace(" ", "_"), data.get(score, 0)))
            row.append(val)
        # One-hot encode categoricals
        X_cat = ohe.transform([row[:5]])
        X_num = np.array([row[5:]], dtype=float)
        X = np.hstack([X_cat, X_num])
        X_scaled = scaler.transform(X)
        # Predict
        y_pred = model.predict(X_scaled)[0]
        y_pred_grade, message = score_to_grade(round(float(y_pred), 1))
        # Find k=5 neighbors
        distances, indices = model.kneighbors(X_scaled, n_neighbors=5)
        neighbors = []
        for idx, dist in zip(indices[0], distances[0]):
            neighbors.append({"index": int(idx), "distance": float(dist)})
        # Store latest neighbors for admin (by user email if available)
        user_email = data.get("user_email")
        if user_email:
            MONGODB_URI = os.getenv("MONGODB_URI")
            DB_NAME = os.getenv("DB_NAME", "grade_predictor")
            client = MongoClient(MONGODB_URI)
            db = client[DB_NAME]
            db["predictions"].insert_one({
                "user_email": user_email,
                "target_subject": target,
                "predicted_score": round(float(y_pred), 1),
                "predicted_grade": y_pred_grade,
                "message": message,
                "neighbors": neighbors
            })
        latest_neighbors_result = {
            "neighbors": neighbors,
            "target_subject": target,
            "predicted_score": round(float(y_pred), 1),
            "predicted_grade": y_pred_grade,
            "message": message
        }
        return jsonify({
            "success": True,
            "predicted_score": round(float(y_pred), 1),
            "predicted_grade": y_pred_grade,
            "target_subject": target,
            "message": message,
            "neighbors": neighbors,
            "info": f"Prediction for {target} generated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.get("/api/admin/last_neighbors")
def get_last_neighbors():
    global latest_neighbors_result
    if latest_neighbors_result is None:
        return jsonify({"success": False, "message": "No prediction has been made yet."}), 404
    return jsonify({"success": True, **latest_neighbors_result})

@app.get("/api/admin/predictions")
def get_all_predictions():
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME = os.getenv("DB_NAME", "grade_predictor")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    preds = list(db["predictions"].find({}))
    for pred in preds:
        pred["_id"] = str(pred["_id"])
    return jsonify({"success": True, "predictions": preds})

@app.get("/api/users")
def get_users():
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME = os.getenv("DB_NAME", "grade_predictor")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    users = list(db["users"].find({}, {"password": 0}))  # Exclude password
    for user in users:
        user["_id"] = str(user["_id"])
    return jsonify({"success": True, "users": users})

@app.put("/api/users/<user_id>")
def update_user(user_id):
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME = os.getenv("DB_NAME", "grade_predictor")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    data = request.get_json(force=True)
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "email" in data:
        update_fields["email"] = data["email"]
    if not update_fields:
        return jsonify({"success": False, "message": "No fields to update."}), 400
    result = db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"success": False, "message": "User not found."}), 404
    return jsonify({"success": True, "message": "User updated."})

@app.delete("/api/users/<user_id>")
def delete_user(user_id):
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME = os.getenv("DB_NAME", "grade_predictor")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    result = db["users"].delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        return jsonify({"success": False, "message": "User not found."}), 404
    return jsonify({"success": True, "message": "User deleted."})

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)