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
    topic: "Veggie vibes:",
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
    topic: "Grain game",
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
    topic: "Power proteins",
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
    topic: "Hydration hero",
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
    topic: "Snack smart",
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
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that evaluates the quality of responses to nutrition-related questions. 
              For each response, provide a score from 0 to 10 and a brief explanation. 
              Please follow these guidelines for scoring:
              - Score 0 for responses that are nonsensical, irrelevant, or completely unrelated to the question.
              - Score 1-3 for responses that are minimally relevant or show very little effort in addressing the question.
              - Score 4-6 for partially relevant answers that show some effort but lack completeness or clarity.
              - Score 7-10 for responses that are mostly relevant, complete, detailed, and clear.
              Ensure that irrelevant or nonsensical responses are strictly rated 0, even if there is an attempt to respond. Additionally, provide a brief summary of the feedback in 10-15 words at the end.`,
            },

            {
              role: "user",
              content: `Evaluate the following answer for question ${
                index + 1
              }: "${questions[index].question}". The answer is: "${answer}". 
              If the answer is nonsensical, irrelevant, or unrelated to the question, assign a score of 0. 
              If the answer makes some sense but lacks detail or relevance, score it between 1 and 3. 
              Provide a brief explanation of your score and reasoning, followed by a short feedback summary (10-15 words).`,
            },
          ],
          max_tokens: 300,
          temperature: 0,
          top_p: 1.0,
        });
        console.log(response.choices[0].message);

        return response.choices[0].message.content.trim();
      })
    );

    let totalScore = 0;
    const detailedFeedback = [];

    evaluationResponses.forEach((evaluation, index) => {
      const lines = evaluation.split("\n");
      const scoreLine = lines[0] || ""; // Default to an empty string if undefined
      const explanation = lines.slice(1).join("\n").trim(); // Join remaining lines as explanation

      const scoreMatch = scoreLine.match(/Score:\s*(\d+)/);
      let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

      totalScore += score;
      detailedFeedback.push({
        question: questions[index].question,
        topic: questions[index].topic,
        score: score,
        feedback: explanation,
        summary: lines[lines.length - 1].trim(), // The last line should be the summary
      });
    });

    const maxScore = questions.length * 10;
    const averageScore = totalScore / questions.length;

    res.json({ totalScore, maxScore, detailedFeedback, averageScore });
  } catch (error) {
    console.error("Error during evaluation:", error);
    res.status(500).json({ error: "An error occurred during evaluation." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
