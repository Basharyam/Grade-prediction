let form= document.getElementById("registerForm");
let input_name=document.getElementById("name");
let input_email=document.getElementById("email");
let input_password=document.getElementById("password");
let confirm_pass=document.getElementById("confirm");

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

    let vaild = true ; 

    // check if the name is legal
    const nameRegex = /^[A-Za-z\s]+$/;
    if(input_name.value.length > 50 || !nameRegex.test(input_name.value.trim())){
        vaild=false;
        input_name.classList.add("is-invalid");
        nameInvalidFeedback.style.display = "block";
    }else {
        input_name.classList.add("is-valid");
        nameValidFeedback.style.display = "block";
    }

    // checks if the password is legal 
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
    if (!passwordRegex.test(input_password.value) || input_password.value.length >15 || input_password.value.length < 7){
        vaild = false;
        input_password.classList.add("is-invalid");
        passwordInvalidFeedback.style.display = "block";
    } else{
        input_password.classList.add("is-valid");
        passwordValidFeedback.style.display = "block";
    }

    // check if the the confirm pass is the same . 
    if (confirm_pass.value !== input_password.value){
        vaild = false ; 
        confirm_pass.classList.add("is-invalid");
        confirmPassInvalidFeedback.style.display = "block";
    } else { 
        confirm_pass.classList.add("is-valid");
        confirmPassValidFeedback.style.display = "block";
    }

    //check if the email is legal 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input_email.value)){
        vaild = false ; 
        input_email.classList.add("is-invalid");
        emailInvalidFeedback.style.display = "block";
    } else {
        input_email.classList.add("is-valid");
        emailValidFeedback.style.display = "block";
    }

    if (!vaild) return;

    const payload = {
        name: input_name.value.trim(),
        email: input_email.value.trim(),
        password: input_password.value
    };

    try {
        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success) {
            alert('Registration successful! Redirecting to login...');
            window.location.href = 'login.html';
        } else {
            alert(`Error: ${result.error || result.message || 'Unknown error'}`);
        }

        form.reset();
        [input_name, input_email, input_password, confirm_pass].forEach(i => i.classList.remove('is-valid'));

    } catch (err) {
        console.error('Network error:', err);
        alert('Network error. Please try again later.');
    }
});


