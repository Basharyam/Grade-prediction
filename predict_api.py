# predict_api.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle

# -------- טעינת המודל וה־encoders פעם אחת עם עליית השרת --------
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

with open("encoders.pkl", "rb") as f:
    encoders = pickle.load(f)

# סדר העמודות חייב להיות זהה לאימון
FEATURE_ORDER = [
    'gender',
    'race',
    'parental level of education',
    'lunch',
    'test preparation course',
    'math score',
    'reading score',
    'writing score'
]

app = Flask(__name__)
CORS(app)  # אם תעבוד דרך פרוקסי של Node.js לא חובה, אבל לא מזיק

def safe_encode(le, value):
    """LabelEncoder לא אוהב ערכים לא מוכרים – נמפה לקטגוריה הנפוצה/ראשונה."""
    try:
        return int(le.transform([value])[0])
    except Exception:
        # אם הערך לא קיים, נקח את המחלקה הראשונה (או תתאים כאן ברירת מחדל אחרת)
        return int(le.transform([le.classes_[0]])[0])

def to_letter_grade(avg):
    """ממוצע 0‑100 לאות A‑F (אפשר לשנות ספים אם תרצה)."""
    if avg >= 90: return 'A'
    if avg >= 80: return 'B'
    if avg >= 70: return 'C'
    if avg >= 60: return 'D'
    return 'F'

@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)

        # שמות השדות מהפרונט (camel/underscore) -> שמות העמודות במודל
        genders = {"male": "male", "female": "female"}  # אם ב‑DB כתוב אחרת, עדכן כאן
        testprep = {"completed": "completed", "none": "none"}

        row = {
            'gender': genders.get(str(data.get('gender', '')).lower(), str(data.get('gender', ''))),
            'race': data.get('race', ''),
            'parental level of education': data.get('parental_level_of_education', ''),
            'lunch': data.get('lunch', ''),
            'test preparation course': testprep.get(str(data.get('test_preparation_course','')).lower(),
                                                   str(data.get('test_preparation_course',''))),
            'math score': float(data.get('math_score', 0)),
            'reading score': float(data.get('reading_score', 0)),
            'writing score': float(data.get('writing_score', 0)),
        }

        # קידוד קטגוריות כמו באימון
        for col in ['gender', 'race', 'parental level of education', 'lunch', 'test preparation course']:
            row[col] = safe_encode(encoders[col], row[col])

        # בניית DataFrame בסדר העמודות הנכון
        X = pd.DataFrame([[row[c] for c in FEATURE_ORDER]], columns=FEATURE_ORDER)

        # חיזוי שלושת הציונים
        y_pred = model.predict(X)  # צורה: [[math, reading, writing]]
        math_p, read_p, write_p = [float(x) for x in y_pred[0]]
        avg_pred = float(np.mean([math_p, read_p, write_p]))
        letter = to_letter_grade(avg_pred)

        # "ביטחון" היקש מהמרחקים לשכנים (0‑1)
        try:
            distances, _ = model.kneighbors(X, n_neighbors=model.n_neighbors)
            mean_d = float(np.mean(distances))
            confidence = 1.0 / (1.0 + mean_d)  # קטן=קרוב => ביטחון גבוה
        except Exception:
            confidence = 0.6  # ברירת מחדל

        return jsonify({
            "success": True,
            "prediction": letter,
            "predicted_scores": {
                "math": round(math_p, 1),
                "reading": round(read_p, 1),
                "writing": round(write_p, 1),
                "average": round(avg_pred, 1)
            },
            "confidence": round(confidence, 3),
            "message": "Prediction generated successfully"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == "__main__":
    # הפעל: python predict_api.py
    app.run(host="0.0.0.0", port=5001, debug=True)
