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

1. **Install Dependencies**:
   ```bash
   # Python dependencies
   pip install flask flask-cors numpy pandas scikit-learn pymongo

   # Node.js dependencies
   npm install
   ```

2. **Database Setup**:
   - Install MongoDB
   - Set environment variables:
     - MONGODB_URI
     - DB_NAME

3. **Train Model**:
   ```bash
   cd backend/python
   python train_model.py
   ```

4. **Start Servers**:
   ```bash
   # Start Node.js server (port 3000)
   node server.js

   # Start Flask server (port 5002)
   python backend/python/app.py
   ```

5. **Access Application**:
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

- [Your Name]
- [Other Contributors]

## License

[Your License]