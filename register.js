let form = document.getElementById("registerForm");
let input_name = document.getElementById("name");
let input_email = document.getElementById("email");
let input_password = document.getElementById("password");
let confirm_pass = document.getElementById("confirm");

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    input_name.classList.remove("is-valid", "is-invalid");
    input_email.classList.remove("is-valid", "is-invalid");
    input_password.classList.remove("is-valid", "is-invalid");
    confirm_pass.classList.remove("is-valid", "is-invalid");

    let nameInvalidFeedback = input_name.parentElement.querySelector(".invalid-feedback");
    let nameValidFeedback = input_name.parentElement.querySelector(".valid-feedback");
    let emailInvalidFeedback = input_email.parentElement.querySelector(".invalid-feedback");
    let emailValidFeedback = input_email.parentElement.querySelector(".valid-feedback");
    let passwordInvalidFeedback = input_password.parentElement.querySelector(".invalid-feedback");
    let passwordValidFeedback = input_password.parentElement.querySelector(".valid-feedback");
    let confirmPassInvalidFeedback = confirm_pass.parentElement.querySelector(".invalid-feedback");
    let confirmPassValidFeedback = confirm_pass.parentElement.querySelector(".valid-feedback");

    nameInvalidFeedback.style.display = "none";
    nameValidFeedback.style.display = "none";
    emailInvalidFeedback.style.display = "none";
    emailValidFeedback.style.display = "none";
    passwordInvalidFeedback.style.display = "none";
    passwordValidFeedback.style.display = "none";
    confirmPassInvalidFeedback.style.display = "none";
    confirmPassValidFeedback.style.display = "none";

    let valid = true;

    // check if the name is legal
    const nameRegex = /^[A-Za-z\s]+$/;
    if (input_name.value.length > 50 || !nameRegex.test(input_name.value.trim())) {
        valid = false;
        input_name.classList.add("is-invalid");
        nameInvalidFeedback.style.display = "block";
    } else {
        input_name.classList.add("is-valid");
        nameValidFeedback.style.display = "block";
    }

    // checks if the password is legal 
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
    if (!passwordRegex.test(input_password.value) || input_password.value.length > 15 || input_password.value.length < 7) {
        valid = false;
        input_password.classList.add("is-invalid");
        passwordInvalidFeedback.style.display = "block";
    } else {
        input_password.classList.add("is-valid");
        passwordValidFeedback.style.display = "block";
    }

    // check if the the confirm pass is the same . 
    if (confirm_pass.value !== input_password.value) {
        valid = false;
        confirm_pass.classList.add("is-invalid");
        confirmPassInvalidFeedback.style.display = "block";
    } else {
        confirm_pass.classList.add("is-valid");
        confirmPassValidFeedback.style.display = "block";
    }

    //check if the email is legal 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input_email.value)) {
        valid = false;
        input_email.classList.add("is-invalid");
        emailInvalidFeedback.style.display = "block";
    } else {
        input_email.classList.add("is-valid");
        emailValidFeedback.style.display = "block";
    }

    if (!valid) return;

    const payload = {
        name: input_name.value.trim(),
        email: input_email.value.trim(),
        password: input_password.value
    };

    try {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating Account...';
        submitBtn.disabled = true;

        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success) {
            showNotification('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showNotification(`Error: ${result.error || result.message || 'Unknown error'}`, 'error');
        }

        form.reset();
        [input_name, input_email, input_password, confirm_pass].forEach(i => i.classList.remove('is-valid'));

    } catch (err) {
        console.error('Network error:', err);
        showNotification('Network error. Please try again later.', 'error');
    } finally {
        // Reset button state
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Create Account';
        submitBtn.disabled = false;
    }
});

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

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
});

function checkAuthStatus() {
  const user = sessionStorage.getItem('user');
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');

  if (user) {
    // User is logged in
    const userData = JSON.parse(user);
    userName.textContent = userData.name || userData.email;
    authButtons.style.display = 'none';
    userInfo.style.display = 'flex';
  } else {
    // User is not logged in
    authButtons.style.display = 'flex';
    userInfo.style.display = 'none';
  }
}

function logout() {
  // Clear session storage
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  // Show notification
  showNotification('Logged out successfully!', 'success');
  
  // Update navigation
  setTimeout(() => {
    checkAuthStatus();
    // Redirect to home page
    window.location.href = '/';
  }, 1000);
}

