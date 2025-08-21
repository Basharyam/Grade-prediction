// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded, checking auth status...');
  checkAuthStatus();
});

function checkAuthStatus() {
  const user = sessionStorage.getItem('user');
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  const welcomeSection = document.getElementById('welcome-section');
  const welcomeMessage = document.getElementById('welcome-message');

  console.log('Checking auth status...');
  console.log('User data:', user);

  if (user) {
    // User is logged in
    try {
      const userData = JSON.parse(user);
      const userNameText = userData.name || userData.email || 'User';
      
      // Update navigation
      userName.textContent = userNameText;
      authButtons.style.display = 'none';
      userInfo.classList.add('show');
      
      // Show welcome message in the middle of the screen
      welcomeMessage.textContent = `Welcome back, ${userNameText}!`;
      welcomeSection.style.display = 'block';
      
      console.log('User is logged in, showing welcome message');
    } catch (error) {
      console.error('Error parsing user data:', error);
      authButtons.style.display = 'flex';
      userInfo.classList.remove('show');
      welcomeSection.style.display = 'none';
      if (userName) userName.textContent = 'User';
    }
  } else {
    // User is not logged in - ensure everything is hidden
    authButtons.style.display = 'flex';
    userInfo.classList.remove('show');
    welcomeSection.style.display = 'none';
    
    // Clear any user data from display
    if (userName) {
      userName.textContent = 'User';
    }
    
    console.log('User is not logged in, showing auth buttons');
  }
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

