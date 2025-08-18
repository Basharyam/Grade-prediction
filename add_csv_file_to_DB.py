import pandas as pd
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://bsharyamin:bsharyamin1@cluster0.adkazmg.mongodb.net/grade_predictor?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = os.getenv("DB_NAME", "grade_predictor")
COLLECTION = os.getenv("COLLECTION", "grades")

# Connect to MongoDB
try:
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION]
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    exit(1)

# Read the updated CSV file
try:
    df = pd.read_csv("course_grade_dataset_.csv")
    print(f"Loaded {len(df)} records from course_grade_dataset_.csv")
except FileNotFoundError:
    print("Error: course_grade_dataset_.csv not found. Please ensure the file exists.")
    exit(1)
except Exception as e:
    print(f"Error reading CSV file: {e}")
    exit(1)

# Convert to dictionary format and insert into MongoDB
try:
    data = df.to_dict(orient="records")
    if not data:
        print("Warning: No data to insert. The DataFrame is empty.")
    else:
        result = collection.insert_many(data)
        print(f"Successfully inserted {len(result.inserted_ids)} records into {COLLECTION} collection.")
except Exception as e:
    print(f"Error inserting data into MongoDB: {e}")
    exit(1)

# Close the connection
client.close()
print("MongoDB connection closed.")