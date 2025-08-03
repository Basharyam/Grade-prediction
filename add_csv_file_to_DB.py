import pandas as pd
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://bsharyamin:bsharyamin1@cluster0.adkazmg.mongodb.net/grade_predictor?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)

db = client["grade_predictor"]
collection = db["grades"]

df = pd.read_csv("Data.csv")

data = df.to_dict(orient="records")

collection.insert_many(data)
