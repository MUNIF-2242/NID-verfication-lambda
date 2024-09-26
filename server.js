const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sample questions and criteria
const questions = [
  {
    question: "What is your daily intake of fruits and vegetables?",
    criteria: [
      "Variety of fruits and vegetables",
      "Daily intake frequency",
      "Portion sizes",
      "Nutritional benefits",
      "Personal preferences",
    ],
  },
  {
    question: "How often do you consume whole grains?",
    criteria: [
      "Types of whole grains",
      "Frequency of consumption",
      "Portion sizes",
      "Nutritional benefits",
      "Personal preferences",
    ],
  },
  {
    question: "What are your sources of protein?",
    criteria: [
      "Variety of protein sources",
      "Quality of protein",
      "Balance of animal vs. plant protein",
      "Portion sizes",
      "Nutritional benefits",
    ],
  },
  {
    question: "How do you stay hydrated?",
    criteria: [
      "Water intake",
      "Other beverages",
      "Frequency of hydration",
      "Effects of hydration on health",
      "Personal preferences",
    ],
  },
  {
    question: "What is your approach to healthy snacks?",
    criteria: [
      "Types of snacks",
      "Frequency of snacking",
      "Nutritional value of snacks",
      "Portion control",
      "Personal preferences",
    ],
  },
];

app.get("/questions", (req, res) => {
  const formattedQuestions = questions.map((q) => q.question);
  res.json(formattedQuestions);
});

app.post("/submit", async (req, res) => {
  const { answers } = req.body;

  try {
    const evaluationResponses = await Promise.all(
      answers.map(async (answer, index) => {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that evaluates the quality of responses to nutrition-related questions. Provide a score from 0 to 10, a brief explanation, and reference the criteria.`,
            },
            {
              role: "user",
              content: `Evaluate the following answer for question ${
                index + 1
              }: "${
                questions[index].question
              }". The answer is: "${answer}". Criteria include: ${questions[
                index
              ].criteria.join(
                ", "
              )}. Provide a score from 0 to 10 and a brief explanation of the score.`,
            },
          ],
          max_tokens: 1000,
        });

        return response.choices[0].message.content.trim();
      })
    );

    // Log evaluation responses for debugging
    console.log("Evaluation Responses:", evaluationResponses);

    // Parse scores and explanations
    let totalScore = 0;
    const feedback = [];

    evaluationResponses.forEach((evaluation) => {
      const lines = evaluation.split("\n");
      const scoreLine = lines[0] || ""; // Default to an empty string if undefined
      const explanation = lines.slice(1).join("\n").trim(); // Join remaining lines as explanation

      // Attempt to parse the score safely with multiple formats
      const scoreMatch = scoreLine.match(
        /(?:Score:|I would rate this answer a|Score is)\s*(\d+)/
      );
      if (scoreMatch && scoreMatch[1]) {
        const score = parseInt(scoreMatch[1], 10);
        totalScore += score;
        feedback.push(explanation);
      } else {
        console.warn("Score not found in evaluation:", evaluation);
        feedback.push("Score not found in evaluation.");
      }
    });

    const maxScore = questions.length * 10; // Calculate max score dynamically
    console.log("Feedback:", feedback);
    console.log("Total Score:", totalScore);

    res.json({ score: totalScore, maxScore, feedback });
  } catch (error) {
    console.error("Error during evaluation:", error);
    res.status(500).json({ error: "An error occurred during evaluation." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
