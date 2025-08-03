document.getElementById("predictForm").addEventListener("submit", async function (e) {
  e.preventDefault();

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
      document.getElementById("result").innerHTML = `<p style="color: red;">Error: ${result.error}</p>`;
      return;
    }

    const { predicted_math_score, predicted_reading_score, predicted_writing_score } = result;

    let advice = "";

    // Math advice
    if (predicted_math_score < 70) {
      advice += "📉 Try to improve your math skills.<br>";
    } else {
      advice += "✅ Great math score!<br>";
    }

    // Reading advice
    if (predicted_reading_score < 70) {
      advice += "📚 Work on reading comprehension.<br>";
    } else {
      advice += "✅ Your reading is solid.<br>";
    }

    // Writing advice
    if (predicted_writing_score < 70) {
      advice += "✍️ Practice more writing exercises.<br>";
    } else {
      advice += "✅ Excellent writing ability.<br>";
    }

    document.getElementById("result").innerHTML = `
      <h3>📊 Predicted Scores</h3>
      <ul>
        <li><strong>Math:</strong> ${predicted_math_score}</li>
        <li><strong>Reading:</strong> ${predicted_reading_score}</li>
        <li><strong>Writing:</strong> ${predicted_writing_score}</li>
      </ul>
      <h3>🧠 Personalized Advice</h3>
      <p>${advice}</p>
    `;
  } catch (error) {
    document.getElementById("result").innerHTML = `<p style="color: red;">Error connecting to server: ${error.message}</p>`;
  }
});
