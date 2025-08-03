import pandas as pd
from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import LabelEncoder
import pickle

# התחברות למסד הנתונים
client = MongoClient("mongodb+srv://bsharyamin:bsharyamin1@cluster0.adkazmg.mongodb.net/grade_predictor?retryWrites=true&w=majority&appName=Cluster0")
db = client["grade_predictor"]
collection = db["grades"]

# קריאת כל המסמכים לקובץ pandas
df = pd.DataFrame(list(collection.find()))

# מחיקת עמודת _id שנוצרת אוטומטית
if '_id' in df.columns:
    df.drop(columns=['_id'], inplace=True)

# המרת עמודות טקסטואליות לערכים מספריים
encoders = {}  # כדי לשמור את המקודדים לשימוש עתידי
for column in ['gender', 'race', 'parental level of education', 'lunch', 'test preparation course']:
    le = LabelEncoder()
    df[column] = le.fit_transform(df[column])
    encoders[column] = le  # שומרים את המקודד לכל עמודה

# הגדרת X (מאפיינים) ו־y (המטרה – כאן math_score)
X = df[['gender', 'race', 'parental level of education', 'lunch',
        'test preparation course', 'math score', 'reading score', 'writing score']]

y = df[['math score', 'reading score', 'writing score']]  # או ציונים עתידיים אחרים


# חלוקה לאימון ובדיקה (בדיקה = 20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# אימון המודל
model = KNeighborsRegressor(n_neighbors=3)
model.fit(X_train, y_train)

# שמירת המודל
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

# שמירת המקודדים לשימוש ב-Flask
with open("encoders.pkl", "wb") as f:
    pickle.dump(encoders, f)

print("✅ KNN model trained and saved to model.pkl")
