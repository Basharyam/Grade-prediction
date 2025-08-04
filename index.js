// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, checking auth status...');
    checkAuthStatus();
  });
  
  function checkAuthStatus() {
    const user = sessionStorage.getItem('user');
    const authButtons = document.getElementById('auth-buttons');
  
    console.log('Checking auth status...');
    console.log('User data:', user);
  
    if (user) {
      // User is logged in - hide auth buttons
      console.log('User is logged in, hiding auth buttons');
      authButtons.style.display = 'none';
    } else {
      // User is not logged in - show auth buttons
      console.log('User is not logged in, showing auth buttons');
      authButtons.style.display = 'flex';
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
  
  // Test function to manually set user data (for debugging)
  function testLogin() {
    const testUser = {
      name: 'Test User',
      email: 'test@example.com'
    };
    sessionStorage.setItem('user', JSON.stringify(testUser));
    sessionStorage.setItem('token', 'test-token');
    checkAuthStatus();
    console.log('Test login completed');
  }
  
  // Expose test function globally for debugging
  window.testLogin = testLogin;