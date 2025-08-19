// --- Event Listener for Check Results Button ---
document.getElementById("predictForm").addEventListener("submit", function (e) {
  e.preventDefault();
  checkResults();
});

async function checkResults() {
  const targetSubject = document.getElementById('target_subject').value;
  const scoresGrid = document.getElementById('scores-grid');

  // Input validation
  const requiredFields = ['gender', 'race', 'education', 'lunch', 'test_prep'];
  let valid = true;
  let errorMsg = '';

  // Validate categorical fields
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
      value = document.getElementById(field).value;
      if (!value) {
        valid = false;
        errorMsg = `Please enter/select ${field.replace('_', ' ')}.`;
        break;
      }
    }
  }

  // Validate score fields dynamically
  const scoreInputs = scoresGrid.querySelectorAll('input[type="number"]');
  const scoreData = {};
  if (scoreInputs.length !== 7) {
    valid = false;
    errorMsg = "Please select a subject to predict to enable score inputs.";
  } else {
    scoreInputs.forEach(input => {
      const field = input.id;
      const value = parseFloat(input.value);
      if (isNaN(value)) {
        valid = false;
        errorMsg = `Please enter a valid number for ${field.replace('_', ' ')}.`;
      } else if (value < 0 || value > 100) {
        valid = false;
        errorMsg = `${field.replace('_', ' ')} must be between 0 and 100.`;
      }
      scoreData[field] = value;
    });
  }

  if (!valid) {
    document.getElementById("result").innerHTML = `<p style='color: #ff6b6b;'>${errorMsg}</p>`;
    return;
  }

  // Show progress bar
  const progress = document.getElementById('progress');
  const progressFill = document.querySelector('#progress .progress-fill');
  progress.style.display = 'block';
  progressFill.style.width = '0';
  let width = 0;
  const interval = setInterval(() => {
    if (width >= 100) clearInterval(interval);
    else width += 5;
    progressFill.style.width = `${width}%`;
  }, 200);

  // Build data for backend
  const data = {
    gender: document.querySelector('input[name="gender"]:checked').value,
    race: document.getElementById("race").value,
    parental_level_of_education: document.getElementById("education").value,
    lunch: document.getElementById("lunch").value,
    test_preparation_course: document.querySelector('input[name="test_prep"]:checked').value,
    target_subject: targetSubject,
    timestamp: new Date().toISOString() // Add timestamp for potential future use
  };
  // Attach user email if logged in
  const user = sessionStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.email) {
        data.user_email = userData.email;
      }
      if (userData.lastLogin) {
        data.last_login = userData.lastLogin; // Pass last login if available
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  // Add only the remaining 7 scores, excluding the target subject
  for (const [field, value] of Object.entries(scoreData)) {
    if (field !== targetSubject) {
      data[field.replace('_', ' ')] = value;
    }
  }

  try {
    const response = await fetch("http://localhost:5002/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.error) {
      document.getElementById("result").innerHTML = `<p style='color: #ff6b6b;'>Error: ${result.error}</p>`;
      console.error('Prediction error:', result.error);
      return;
    }
    if (!result.success && result.message) {
      document.getElementById("result").innerHTML = `<p style='color: #ff6b6b;'>Error: ${result.message}</p>`;
      console.error('Prediction message:', result.message);
      return;
    }

    const { predicted_score, predicted_grade, target_subject, message, avg_grade } = result;
    let subjectLabel = target_subject.charAt(0).toUpperCase() + target_subject.slice(1).replace(' score', '');
    // Tailored advice section (using message from backend)
    document.getElementById("result").innerHTML = `
      <div class="result-section show">
        <h2><i class="fas fa-chart-line me-2"></i>Prediction Results</h2>
        <div><strong>${subjectLabel} Predicted Score:</strong> <span style="font-size:2rem;color:#007bff;">${predicted_score}</span> / 100</div>
        <div><strong>Grade:</strong> <span style="font-size:1.5rem;color:#28a745;">${predicted_grade}</span></div>
        <div><strong>Average ${subjectLabel} Score:</strong> <span style="font-size:1.5rem;color:#6c757d;">${avg_grade}</span> / 100</div>
        <div class="result-meta">
          <i class="fas fa-info-circle me-1"></i>
          This prediction is based on your current academic performance and demographic factors.
        </div>
        <div class="advice-section" style="margin-top:1rem;">
          <strong>Message:</strong> <span style="color:#51cf66;">${message}</span>
        </div>
      </div>
    `;
    document.getElementById("result").scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    document.getElementById("result").innerHTML = `
      <div class="result-section show">
        <h2 style="color: #ff6b6b;"><i class="fas fa-exclamation-triangle me-2"></i>Error</h2>
        <p style="color: #ff6b6b;">Unable to connect to the prediction service. Please try again later.</p>
        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Error details: ${error.message}</p>
      </div>
    `;
    console.error('Fetch error:', error);
  } finally {
    clearInterval(interval);
    progress.style.display = 'none';
    progressFill.style.width = '0';
  }
}

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
    try {
      const userData = JSON.parse(user);
      const userNameText = userData.name || userData.email || 'User';
      console.log('User data parsed:', userData);
      
      userName.textContent = `Welcome, ${userNameText} 👋`;
      authButtons.style.display = 'none';
      userInfo.style.display = 'flex';
      userWelcomeSection.style.display = 'none';
      console.log('User is logged in, showing welcome message and logout button on predict page');
    } catch (error) {
      console.error('Error parsing user data:', error);
      authButtons.style.display = 'flex';
      userInfo.style.display = 'none';
      userWelcomeSection.style.display = 'none';
    }
  } else {
    console.log('User is not logged in, showing auth buttons on predict page');
    authButtons.style.display = 'flex';
    userInfo.style.display = 'none';
    userWelcomeSection.style.display = 'none';
  }
}

function logout() {
  console.log('Logout clicked from predict page');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  console.log('Session storage cleared');
  showNotification('Logged out successfully!', 'success');
  setTimeout(() => {
    checkAuthStatus();
    window.location.href = '/';
  }, 1000);
}

// Notification function
function showNotification(message, type = 'info') {
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