document.getElementById("predictForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Input validation
  const requiredFields = [
    'gender', 'race', 'education', 'lunch', 'test_prep', 'math_score', 'reading_score', 'writing_score'
  ];
  let valid = true;
  let errorMsg = '';
  for (const field of requiredFields) {
    let value;
    if (['gender', 'test_prep'].includes(field)) {
      value = document.querySelector(`input[name="${field}"]:checked`);
      if (!value) {
        valid = false;
        errorMsg = `Please select ${field.replace('_', ' ')}.`;
        break;
      }
    } else {
      value = document.getElementById(field === 'education' ? 'education' : field).value;
      if (!value) {
        valid = false;
        errorMsg = `Please enter/select ${field.replace('_', ' ')}.`;
        break;
      }
      if (["math_score", "reading_score", "writing_score"].includes(field) && isNaN(parseFloat(value))) {
        valid = false;
        errorMsg = `Please enter a valid number for ${field.replace('_', ' ')}.`;
        break;
      }
    }
  }
  if (!valid) {
    document.getElementById("result").innerHTML = `<p style='color: #ff6b6b;'>${errorMsg}</p>`;
    return;
  }

  // Show loading spinner
  document.getElementById("result").innerHTML = `<div class='result-section show'><div class='text-center'><div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Loading...</span></div><p>Predicting your grade...</p></div></div>`;

  const data = {
    gender: document.querySelector('input[name="gender"]:checked').value,
    race: document.getElementById("race").value,
    parental_level_of_education: document.getElementById("education").value,
    lunch: document.getElementById("lunch").value,
    test_preparation_course: document.querySelector('input[name="test_prep"]:checked').value,
    math_score: parseFloat(document.getElementById("math_score").value),
    reading_score: parseFloat(document.getElementById("reading_score").value),
    writing_score: parseFloat(document.getElementById("writing_score").value)
  };

  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.error) {
      document.getElementById("result").innerHTML = `<p style='color: #ff6b6b;'>Error: ${result.error}</p>`;
      return;
    }
    if (!result.success && result.message) {
      document.getElementById("result").innerHTML = `<p style='color: #ff6b6b;'>Error: ${result.message}</p>`;
      return;
    }

    const { prediction, confidence, message } = result;
    
    // Calculate average score for context
    const avgScore = (data.math_score + data.reading_score + data.writing_score) / 3;
    
    // Generate personalized advice based on prediction
    let advice = "";
    let adviceColor = "";
    
    switch(prediction) {
      case 'A':
        advice = "🎉 Outstanding! You're on track for excellent academic performance. Keep up the great work!";
        adviceColor = "#51cf66";
        break;
      case 'B':
        advice = "👍 Good work! You're performing well. Focus on areas of improvement to reach the next level.";
        adviceColor = "#74c0fc";
        break;
      case 'C':
        advice = "📚 You're doing okay, but there's room for improvement. Consider additional study time and practice.";
        adviceColor = "#ffd43b";
        break;
      case 'D':
        advice = "⚠️ You need to put in more effort. Consider seeking help from teachers or tutors.";
        adviceColor = "#ff922b";
        break;
      case 'F':
        advice = "🚨 Immediate action needed. Please seek academic support and consider additional resources.";
        adviceColor = "#ff6b6b";
        break;
      default:
        advice = "📊 Based on your current scores, focus on consistent improvement across all subjects.";
        adviceColor = "#868e96";
    }

    document.getElementById("result").innerHTML = `
      <div class="result-section show">
        <h2><i class="fas fa-chart-line me-2"></i>Prediction Results</h2>
        <div class="prediction">${prediction}</div>
        <p><strong>Confidence Level:</strong> ${Math.round(confidence * 100)}%</p>
        <p><strong>Average Score:</strong> ${avgScore.toFixed(1)}/100</p>
        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 10px; border-left: 4px solid ${adviceColor};">
          <p style="color: ${adviceColor}; font-weight: 600; margin: 0;">${advice}</p>
        </div>
        <div style="margin-top: 1rem; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
          <p><i class="fas fa-info-circle me-1"></i>This prediction is based on your current academic performance and demographic factors.</p>
        </div>
      </div>
    `;
    
    // Scroll to results
    document.getElementById("result").scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    document.getElementById("result").innerHTML = `
      <div class="result-section show">
        <h2 style="color: #ff6b6b;"><i class="fas fa-exclamation-triangle me-2"></i>Error</h2>
        <p style="color: #ff6b6b;">Unable to connect to the prediction service. Please try again later.</p>
        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Error details: ${error.message}</p>
      </div>
    `;
  }
});

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Predict page loaded, checking auth status...');
  checkAuthStatus();
});

function checkAuthStatus() {
  const user = sessionStorage.getItem('user');
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  const userWelcomeSection = document.getElementById('user-welcome-section');
  const userWelcomeMessage = document.getElementById('user-welcome-message');

  console.log('Checking auth status on predict page...');
  console.log('User data:', user);

  if (user) {
    // User is logged in
    try {
      const userData = JSON.parse(user);
      const userNameText = userData.name || userData.email || 'User';
      console.log('User data parsed:', userData);
      
      // Update navigation with welcome message and hand wave
      userName.textContent = `Welcome, ${userNameText} 👋`;
      authButtons.style.display = 'none';
      userInfo.style.display = 'flex';
      
      // Hide the welcome section - we only want the name in the navigation bar
      userWelcomeSection.style.display = 'none';
      
      console.log('User is logged in, showing welcome message and logout button on predict page');
    } catch (error) {
      console.error('Error parsing user data:', error);
      // If there's an error parsing, treat as not logged in
      authButtons.style.display = 'flex';
      userInfo.style.display = 'none';
      userWelcomeSection.style.display = 'none';
    }
  } else {
    // User is not logged in
    console.log('User is not logged in, showing auth buttons on predict page');
    authButtons.style.display = 'flex';
    userInfo.style.display = 'none';
    userWelcomeSection.style.display = 'none';
  }
}

function logout() {
  console.log('Logout clicked from predict page');
  
  // Clear session storage
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  console.log('Session storage cleared');
  
  // Show notification
  showNotification('Logged out successfully!', 'success');
  
  // Update navigation
  setTimeout(() => {
    checkAuthStatus();
    // Redirect to home page
    window.location.href = '/';
  }, 1000);
}

// Notification function
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      background: ${type === 'success' ? 'linear-gradient(135deg, #51cf66, #40c057)' : 
                   type === 'error' ? 'linear-gradient(135deg, #ff6b6b, #fa5252)' : 
                   'linear-gradient(135deg, #74c0fc, #4dabf7)'};
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    ">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
      ${message}
    </div>
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);