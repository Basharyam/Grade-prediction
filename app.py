from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

with open("model.pkl", "rb") as f:
    model = pickle.load(f)

with open("encoders.pkl", "rb") as f:
    encoders = pickle.load(f)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    try:
        gender = encoders['gender'].transform([data['gender']])[0]
        race = encoders['race'].transform([data['race']])[0]
        education = encoders['parental_level_of_education'].transform([data['parental_level_of_education']])[0]
        lunch = encoders['lunch'].transform([data['lunch']])[0]
        test_prep = encoders['test preparation course'].transform([data['test_preparation_course']])[0]

        math = float(data["math_score"])
        reading = float(data["reading_score"])
        writing = float(data["writing_score"])

        features = np.array([[gender, race, education, lunch, test_prep, math, reading, writing]])

        predicted = model.predict(features)[0]

        return jsonify({
            "predicted_math_score": round(predicted[0], 2),
            "predicted_reading_score": round(predicted[1], 2),
            "predicted_writing_score": round(predicted[2], 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(port=5000)
