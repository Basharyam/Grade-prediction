document.getElementById("predictForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  const race = document.getElementById("race").value;
  const education = document.getElementById("education").value;
  const lunch = document.getElementById("lunch").value;
  const testPrep = document.querySelector('input[name="test_prep"]:checked')?.value;

  const data = {
    gender,
    race,
    education,
    lunch,
    test_prep: testPrep
  };

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    document.getElementById("result").innerText = `Predicted Grade: ${result.predicted_grade}`;
  } catch (error) {
    console.error("Prediction error:", error);
    document.getElementById("result").innerText = "Error occurred while predicting.";
  }
});