const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Sample questions
const questions = [
  "What do you usually eat for breakfast, and how does it make you feel throughout the morning?",
  "How often do you consume fruits and vegetables, and do you think your intake is adequate for your health needs?",
  "Have you noticed any negative effects on your mood or energy levels related to your diet? If so, can you describe them?",
  "What challenges do you face in maintaining a balanced diet, and how do these challenges affect your daily life?",
  "If you could change one thing about your current eating habits, what would it be, and what steps would you take to make that change?",
];

app.get("/questions", (req, res) => {
  res.json(questions);
});

app.post("/submit", (req, res) => {
  const { answers } = req.body;

  const score = answers.reduce((totalScore, answer, index) => {
    let questionScore = 0;

    switch (index) {
      case 0:
        if (answer.toLowerCase().includes("sugary cereal")) {
          questionScore += 2;
        } else if (
          answer.toLowerCase().includes("oatmeal") ||
          answer.toLowerCase().includes("eggs")
        ) {
          questionScore += 8;
        }
        break;
      case 1:
        if (
          answer.toLowerCase().includes("twice a week") ||
          answer.toLowerCase().includes("not enough")
        ) {
          questionScore += 2;
        } else if (
          answer.toLowerCase().includes("daily") ||
          answer.toLowerCase().includes("yes")
        ) {
          questionScore += 8;
        }
        break;
      case 2:
        if (
          answer.toLowerCase().includes("tired") ||
          answer.toLowerCase().includes("irritable")
        ) {
          questionScore += 2;
        } else if (
          answer.toLowerCase().includes("good") ||
          answer.toLowerCase().includes("energized")
        ) {
          questionScore += 8;
        }
        break;
      case 3:
        if (
          answer.toLowerCase().includes("time") ||
          answer.toLowerCase().includes("budget")
        ) {
          questionScore += 4;
        }
        break;
      case 4:
        if (
          answer.toLowerCase().includes("meal prep") ||
          answer.toLowerCase().includes("planning")
        ) {
          questionScore += 7;
        } else {
          questionScore += 3;
        }
        break;
      default:
        break;
    }
    return totalScore + questionScore;
  }, 0);

  res.json({ score });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
