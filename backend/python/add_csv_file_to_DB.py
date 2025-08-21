# add_csv_file_to_DB.py
# Loads a CSV and inserts rows into MongoDB (Atlas/local) using settings from .env
# Print messages are in English (per your preference).

import os
import sys
import pandas as pd
from pymongo import MongoClient, errors
from dotenv import load_dotenv

def die(msg: str, code: int = 1):
    print(msg)
    raise SystemExit(code)

def main():
    # 1) Load environment variables from .env (same folder)
    load_dotenv()
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME     = os.getenv("DB_NAME", "grade_predictor")
    COLLECTION  = os.getenv("COLLECTION", "grades")

    if not MONGODB_URI:
        die("MONGODB_URI is not set. Ensure .env exists and includes MONGODB_URI.")

    # 2) CSV path from argv or default
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "Data/Data.csv"
    if not os.path.exists(csv_path):
        die(f"CSV file not found: {csv_path}. Pass a path, e.g.: python add_csv_file_to_DB.py data.csv")

    # 3) Read CSV
    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} records from {csv_path}")
    except Exception as e:
        die(f"Failed to read CSV: {e}")

    if df.empty:
        die("CSV is empty. Nothing to insert.")

    # Optional: clean column names
    df.columns = [c.strip() for c in df.columns]

    # Replace NaN with None so Mongo gets nulls
    df = df.where(pd.notnull(df), None)

    # 4) Connect to MongoDB and verify
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=8000)
        client.admin.command("ping")  # fail fast if unreachable
        db = client[DB_NAME]
        col = db[COLLECTION]
        print("MongoDB connection OK.")
    except Exception as e:
        die(f"Failed to connect to MongoDB: {e}")

    # 5) Insert documents
    docs = df.to_dict(orient="records")
    try:
        result = col.insert_many(docs, ordered=False)
        print(f"Successfully inserted {len(result.inserted_ids)} documents into {DB_NAME}.{COLLECTION}.")
    except errors.BulkWriteError as bwe:
        inserted = bwe.details.get("nInserted", 0)
        print(f"Bulk write finished with errors. Inserted {inserted}. Details: {bwe.details}")
    except Exception as e:
        die(f"Insert failed: {e}")

    # 6) Verify count
    try:
        count = col.count_documents({})
        print(f"Collection now has {count} documents.")
    except Exception as e:
        print(f"Count failed: {e}")

    client.close()
    print("MongoDB connection closed.")

if __name__ == "__main__":
    main()
