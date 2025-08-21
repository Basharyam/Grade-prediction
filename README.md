# GradePredictor

A machine learning-powered web application that predicts student grades across multiple subjects using KNN (K-Nearest Neighbors) algorithm.

## Features

- **Grade Prediction**: Predicts grades for 8 different subjects:
  - Mathematics
  - Biology
  - Physics
  - Computer Science
  - Psychology
  - Literature
  - Economics
  - History

- **User Management**:
  - User registration and login
  - Secure password policy
  - Personal prediction history
  - Email validation and uniqueness check

- **Admin Dashboard**:
  - View all registered users
  - Track total predictions
  - View user prediction history
  - User management (edit/delete)

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5 for responsive design
- Font Awesome for icons
- Custom dark theme with glass morphism effects

### Backend
- **Node.js/Express**:
  - Serves static files
  - Handles user authentication
  - API routing
  - MongoDB integration

- **Python/Flask**:
  - Machine learning model (KNN)
  - Grade prediction API
  - Data preprocessing
  - MongoDB integration

### Database
- MongoDB for storing:
  - User data
  - Prediction history
  - System statistics

### Machine Learning
- K-Nearest Neighbors (KNN) Regressor
- Feature preprocessing:
  - One-Hot Encoding for categorical features
  - StandardScaler for numerical features

## Project Structure

```
Grade-prediction/
├── backend/
│   ├── python/
│   │   ├── app.py
│   │   ├── train_model.py
│   │   └── model files (.pkl)
│   └── node/
│       └── server.js
├── static/
│   ├── html/
│   │   ├── index.html
│   │   ├── about.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── predict.html
│   │   └── admin.html
│   ├── css/
│   │   ├── index.css
│   │   ├── about.css
│   │   ├── login.css
│   │   ├── register.css
│   │   ├── predict.css
│   │   └── admin.css
│   └── js/
│       ├── index.js
│       ├── login.js
│       ├── register.js
│       ├── predict.js
│       └── admin.js
└── Data/
    └── Data.csv
```

## Setup Instructions




1.**Create a `.env` file in the project root with the following keys**:

```env
# MongoDB connection string (replace <username> and <password> with your own)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.adkazmg.mongodb.net/grade_predictor?retryWrites=true&w=majority&appName=Cluster0

# Node.js server port
PORT=3000

# Secret key for JWT authentication
JWT_SECRET=your_super_secret_key

# Database and collection names
DB_NAME=grade_predictor
COLLECTION=grades


2. **Install Dependencies**:
   ```bash
   # Python dependencies
   pip install flask flask-cors numpy pandas scikit-learn pymongo

   # Node.js dependencies
   npm install
   ```

3. **Database Setup**:
   - Install MongoDB
   - Set environment variables:
     - MONGODB_URI
     - DB_NAME

4.**CSV TO DB **:
 ```bash
   cd backend/python
   python add_csv_file_to_DB.py
   ```
5. **Train Model**:
   ```bash
   cd backend/python
   python train_model.py
   ```
6. **Start Servers**:
   ```bash
   # Start Node.js server (port 3000)
   node server.js

   # Start Flask server (port 5002)
   python backend/python/app.py
   ```

7. **Access Application**:
   - Open browser and navigate to: `http://localhost:3000`
   - Admin access: Use admin credentials

## Security Features

- Password requirements:
  - One capital letter
  - One lowercase letter
  - One number
  - One special character
  - Length between 7-15 characters

- Email validation:
  - Unique email requirement
  - Email format validation
  - Prevention of email reuse after account deletion

## Contributors

- Mohamad Lahwani
- Bashar Yamin

