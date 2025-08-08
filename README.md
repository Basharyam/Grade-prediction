# Grade-prediction

## Project Overview
This system helps students make informed decisions about which elective courses to register for by predicting the grade they are likely to receive, based on their own grade history and the performance of similar students. The prediction is powered by a K-Nearest Neighbors (KNN) algorithm.

## How the System Works
- The system uses a database of students who have already completed their studies and their grades in various courses.
- The student enters their grade history for courses completed so far.
- The system uses KNN to find students with similar grade profiles.
- The system predicts the student's grade in the course of interest based on the grades of these similar students.

## Features
- User registration, login, and logout
- Grade prediction using KNN
- Admin dashboard for user management (view, edit, delete users)
- Analytics: total users, recent logins
- Modern, responsive UI

## Setup Instructions
1. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url>
   cd Grade-prediction
   npm install
   ```
2. Set up your MongoDB connection string in a `.env` file:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
3. Train the KNN model and start the Flask backend:
   ```bash
   python train_model.py
   python app.py
   ```
4. Start the Node.js server:
   ```bash
   npm start
   ```
5. Open `index.html` in your browser to use the system.

## Usage Guide
### For Students
- Register and log in.
- Enter your grade history and select a course to predict your grade.
- View the prediction and personalized advice.

### For Admins
- Log in as the admin user.
- Access the admin dashboard to:
  - View all registered users and their last login times
  - Edit or delete users
  - View system statistics (total users, recent logins)
- Log out to return to the home page.

## Example Workflow
1. Student registers and logs in.
2. Student enters their grades and requests a prediction.
3. The system finds similar students and predicts the grade.
4. Admin can view all users and recent activity in the dashboard.

---

For more details, see the code and comments in each file. If you have questions or want to contribute, open an issue or pull request!