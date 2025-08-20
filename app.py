from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
import os
import numpy as np
import pickle
import pandas as pd   
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
OHE_PATH = os.path.join(BASE_DIR, "ohe.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")
FEAT_PATH = os.path.join(BASE_DIR, "feature_order.pkl")
AVG_GRADE_PATH = os.path.join(BASE_DIR, "avg_grade.pkl")

if not (os.path.exists(MODEL_PATH) and os.path.exists(OHE_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(FEAT_PATH) and os.path.exists(AVG_GRADE_PATH)):
    raise FileNotFoundError("Model, encoder, scaler, feature order, or average grade file missing.")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)
with open(OHE_PATH, "rb") as f:
    ohe = pickle.load(f)
with open(SCALER_PATH, "rb") as f:
    scaler = pickle.load(f)
with open(FEAT_PATH, "rb") as f:
    FEATURE_ORDER = pickle.load(f)
with open(AVG_GRADE_PATH, "rb") as f:
    AVG_GRADES = pickle.load(f)  # could be float or dict

CATEGORICAL = FEATURE_ORDER[:5]
TARGETS = [
    "math score", "biology score", "physics score", "computer science score",
    "psychology score", "literature score", "economics score", "history score"
]
latest_neighbors_result = None

def score_to_grade(score, subject=None):
    subject_recommendations = {
        "math score": {
            "A": "Consider studying Mathematics, Engineering, or Data Science at university!",
            "B": "You have a strong foundation in Math. Explore advanced math courses or engineering!",
            "C": "Consider extra practice or tutoring in Math to boost your skills for STEM fields.",
            "D": "Focus on strengthening your math basics. Remedial courses can help you prepare for college-level math.",
            "F": "Seek support in Math. Foundational skills are important for many university programs."
        },
        "biology score": {
            "A": "Consider studying Biology, Medicine, or Environmental Science!",
            "B": "You have a good grasp of Biology. Explore advanced courses or health sciences!",
            "C": "Consider extra study in Biology to prepare for life sciences in college.",
            "D": "Strengthen your biology knowledge for future opportunities in health or science.",
            "F": "Seek support in Biology. Understanding basics is key for science fields."
        },
        "physics score": {
            "A": "Consider studying Physics, Engineering, or Astronomy!",
            "B": "You have a solid understanding of Physics. Try advanced physics or engineering courses!",
            "C": "Extra practice in Physics can help you pursue STEM majors.",
            "D": "Focus on physics fundamentals to prepare for college-level science.",
            "F": "Seek help in Physics. Strong basics are needed for science and tech fields."
        },
        "computer science score": {
            "A": "Consider Computer Science, Software Engineering, or AI!",
            "B": "You have a good base in Computer Science. Explore coding bootcamps or advanced courses!",
            "C": "Practice coding and algorithms to prepare for tech majors.",
            "D": "Strengthen your programming skills for future opportunities in tech.",
            "F": "Seek support in Computer Science. Basics are important for tech careers."
        },
        "psychology score": {
            "A": "Consider Psychology, Cognitive Science, or Social Work!",
            "B": "You have a good understanding of Psychology. Explore advanced courses or related fields!",
            "C": "Extra study in Psychology can help you prepare for social sciences.",
            "D": "Focus on psychology basics to prepare for college-level courses.",
            "F": "Seek help in Psychology. Understanding people is key for many fields."
        },
        "literature score": {
            "A": "Consider Literature, Journalism, or Creative Writing!",
            "B": "You have a strong base in Literature. Try advanced writing or journalism courses!",
            "C": "Extra reading and writing can help you prepare for humanities majors.",
            "D": "Strengthen your reading and writing skills for future studies.",
            "F": "Seek support in Literature. Communication skills are important for all fields."
        },
        "economics score": {
            "A": "Consider Economics, Business, or Finance!",
            "B": "You have a good understanding of Economics. Explore business or finance courses!",
            "C": "Extra study in Economics can help you prepare for business majors.",
            "D": "Focus on economics basics to prepare for college-level courses.",
            "F": "Seek help in Economics. Understanding markets is key for many careers."
        },
        "history score": {
            "A": "Consider History, Archaeology, or Political Science!",
            "B": "You have a good grasp of History. Try advanced history or social science courses!",
            "C": "Extra study in History can help you prepare for humanities majors.",
            "D": "Strengthen your history knowledge for future studies.",
            "F": "Seek support in History. Understanding the past is important for many fields."
        },
    }
    if score >= 90:
        grade = "A"
        message = "Excellent work! Keep it up!"
    elif score >= 80:
        grade = "B"
        message = "Good job! Consider refining your skills."
    elif score >= 70:
        grade = "C"
        message = "Satisfactory, but room for improvement."
    elif score >= 60:
        grade = "D"
        message = "Passing, but focus on strengthening this area."
    else:
        grade = "F"
        message = "Failed. Please review and seek support."
    recommendation = None
    if subject and subject in subject_recommendations:
        recommendation = subject_recommendations[subject].get(grade)
    return grade, message, recommendation

def get_avg_for(target):
    """Handle both dict (multiple subjects) and float (single subject) avg."""
    if isinstance(AVG_GRADES, dict):
        return float(AVG_GRADES.get(target, 0))
    try:
        return float(AVG_GRADES)
    except Exception:
        return 0.0

@app.route('/')
def redirect_to_index():
    return redirect(url_for('static', filename='index-chrom.html'))

@app.post("/api/predict")
def api_predict():
    global latest_neighbors_result
    try:
        data = request.get_json(force=True)
        target = data.get("target_subject")
        if not target or target not in TARGETS:
            return jsonify({"success": False, "error": f"Invalid or missing target_subject: {target}"}), 400

        # Only the 7 other scores are features
        other_scores = [s for s in TARGETS if s != target]

        # Validate input
        for cat in CATEGORICAL:
            if cat.replace(" ", "_") not in data and cat not in data:
                return jsonify({"success": False, "error": f"Missing field: {cat}"}), 400
        for score in other_scores:
            if score.replace(" ", "_") not in data and score not in data:
                return jsonify({"success": False, "error": f"Missing field: {score}"}), 400

        # Build input row
        row = []
        for cat in CATEGORICAL:
            val = data.get(cat.replace(" ", "_"), data.get(cat, ""))
            row.append(val)
        for score in other_scores:   # ✅ only 7 values
            val = float(data.get(score.replace(" ", "_"), data.get(score, 0)))
            row.append(val)

        # One-hot encode categoricals
        X_cat = ohe.transform([row[:5]])
        X_num = np.array([row[5:]], dtype=float)  # shape (1,7)
        X = np.hstack([X_cat, X_num])
        X_scaled = scaler.transform(X)

        # Predict
        y_pred = model.predict(X_scaled)[0]
        y_pred_grade, message, recommendation = score_to_grade(round(float(y_pred), 1), target)

        # Find neighbors
        distances, indices = model.kneighbors(X_scaled, n_neighbors=5)
        neighbors = [{"index": int(idx), "distance": float(dist)} for idx, dist in zip(indices[0], distances[0])]

        # Save to DB if email provided
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
                "neighbors": neighbors,
                "created_at": pd.Timestamp.now().isoformat()
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
            "recommendation": recommendation,
            "avg_grade": get_avg_for(target),
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
    users = list(db["users"].find({}, {"password": 0}))
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
    app.run(host="0.0.0.0", port=5002, debug=True)
