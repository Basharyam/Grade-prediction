let form = document.getElementById("loginForm");
let input_email = document.getElementById("email");
let input_password = document.getElementById("password");

form.addEventListener('submit',async (e) => {
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


    let valid =true;

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
    if (!passwordRegex.test(input_password.value) || input_password.value.length >15 || input_password.value.length < 7){
        valid = false;
        input_password.classList.add("is-invalid");
        passwordInvalidFeedback.style.display = "block";
    } else{
        input_password.classList.add("is-valid");
        passwordValidFeedback.style.display = "block";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input_email.value)){
        valid = false ; 
        input_email.classList.add("is-invalid");
        emailInvalidFeedback.style.display = "block";
    } else {
        input_email.classList.add("is-valid");
        emailValidFeedback.style.display = "block";
    }

    if (valid) {
        alert("Login successful");
        form.reset();
        input_email.classList.remove("is-valid");
        input_password.classList.remove("is-valid");
    }

    // Prepare payload
  const payload = {
    email: input_email.value.trim(),
    password: input_password.value
  };

  try {
    // Send login request
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!result.success) {
      // login failed on the server
      alert(result.message || 'Invalid email or password');
      return;
    }

    // login succeeded → save user in sessionStorage
    sessionStorage.setItem('user', JSON.stringify(result.user));

    // redirect to search page
    window.location.href = 'index.html';

  } catch (err) {
    console.error('Network error:', err);
    alert('Network error. Please try again later.');
  }

});

// still need to check if the email and the password is in the DB.
// READ THE REQURIMENTS AGAIN TO CHECK IF I HAVE DONE ALL THE THINGS.