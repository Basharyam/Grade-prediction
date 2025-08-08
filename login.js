let form = document.getElementById("loginForm");
let input_email = document.getElementById("email");
let input_password = document.getElementById("password");

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    input_email.classList.remove("is-valid", "is-invalid");
    input_password.classList.remove("is-valid", "is-invalid");

    let emailInvalidFeedback = input_email.parentElement.querySelector(".invalid-feedback");
    let emailValidFeedback = input_email.parentElement.querySelector(".valid-feedback");
    let passwordInvalidFeedback = input_password.parentElement.querySelector(".invalid-feedback");
    let passwordValidFeedback = input_password.parentElement.querySelector(".valid-feedback");

    emailInvalidFeedback.style.display = "none";
    emailValidFeedback.style.display = "none";
    passwordInvalidFeedback.style.display = "none";
    passwordValidFeedback.style.display = "none";

    let valid = true;

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
    if (!passwordRegex.test(input_password.value) || input_password.value.length > 15 || input_password.value.length < 7) {
        valid = false;
        input_password.classList.add("is-invalid");
        passwordInvalidFeedback.style.display = "block";
    } else {
        input_password.classList.add("is-valid");
        passwordValidFeedback.style.display = "block";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input_email.value)) {
        valid = false;
        input_email.classList.add("is-invalid");
        emailInvalidFeedback.style.display = "block";
    } else {
        input_email.classList.add("is-valid");
        emailValidFeedback.style.display = "block";
    }

    if (!valid) {
        return;
    }

    // Prepare payload
    const payload = {
        email: input_email.value.trim(),
        password: input_password.value
    };

    try {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...';
        submitBtn.disabled = true;

        // Send login request
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (!result.success) {
            // login failed on the server
            showNotification(result.message || 'Invalid email or password', 'error');
            return;
        }

        // Save user and token in sessionStorage
        const userData = {
            name: result.user.name || result.user.email,
            email: result.user.email
        };
        
        console.log('Saving user data:', userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('token', result.token);

        showNotification("Login successful! Redirecting...", 'success');
        
        // Redirect based on user email (case-insensitive)
        setTimeout(() => {
            if (userData.email == 'admin@gmail.com') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'predict.html';
            }
        }, 1500);

    } catch (err) {
        console.error('Network error:', err);
        showNotification('Network error. Please try again later.', 'error');
    } finally {
        // Reset button state
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
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

