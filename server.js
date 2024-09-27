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
              content: `You are a helpful assistant that evaluates the quality of responses to nutrition-related questions. Provide a score from 0 to 10, a brief explanation, and reference the criteria.Assign a score of 0 for responses that are nonsensical or completely irrelevant. Ensure the feedback is structured, highlighting completeness, relevance, detail, and clarity.`,
            },
            {
              role: "user",
              content: `Evaluate the following answer for question ${
                index + 1
              }: "${
                questions[index].question
              }". The answer is: "${answer}". Criteria include: ${questions[
                index
              ].criteria.join(", ")}. ${
                answer ? "" : "The answer is irrelevant."
              } Provide a score from ${
                answer ? 0 : 10
              } to 10 and a brief explanation of the score.`,
            },
          ],
          seed: "1234567890", //is in Beta
          max_tokens: 200,
          temperature: 0, // Reduce randomness by setting temperature close to 0
          top_p: 1.0, // Keeps the model deterministic
        });

        console.log("response");
        console.log(response);

        return response.choices[0].message.content.trim();
      })
    );

    let totalScore = 0;
    const detailedFeedback = [];

    // console.log("evaluationResponses");
    // console.log(evaluationResponses);

    evaluationResponses.forEach((evaluation, index) => {
      const lines = evaluation.split("\n");
      const scoreLine = lines[0] || ""; // Default to an empty string if undefined
      const explanation = lines.slice(1).join("\n").trim(); // Join remaining lines as explanation

      const scoreMatch = scoreLine.match(
        /(?:Score:|I would rate this answer a|Score is)\s*(\d+)/
      );

      let score = 0; // Default score

      if (scoreMatch && scoreMatch[1]) {
        score = parseInt(scoreMatch[1], 10);
      }

      // Check for nonsensical indicators
      const nonsensicalIndicators = [
        "nonsensical",
        "doesn't make sense",
        "irrelevant",
        "incoherent",
        "lack of coherence",
        "fails or  does not address the question",
        "low score.",
        "illogical",
        "incoherent",
        "nonsensical",
        "unrelated",
        "random words",
        "gibberish",
        "confusing",
        "meaningless",
        "no connection",
        "not applicable",
        "makes no sense",
        "wrong context",
        "lacks relevancy",
      ];
      const isNonsensical = nonsensicalIndicators.some((indicator) =>
        explanation.includes(indicator)
      );

      // If the answer is nonsensical, set score to 0
      if (isNonsensical) {
        score = 0;
      }

      totalScore += score; // Sum all the scores
      detailedFeedback.push({
        question: questions[index].question,
        topic: questions[index].topic,
        score: score,
        feedback: explanation,
      });
    });

    const maxScore = questions.length * 10; // Calculate max score dynamically
    const averageScore = totalScore / questions.length; // Calculate average score

    // console.log("Detailed Feedback:", detailedFeedback);
    // console.log("Total Score:", totalScore);
    // console.log("detailedFeedback"); // Log the average score
    // console.log(detailedFeedback); // Log the average score

    res.json({ totalScore, maxScore, detailedFeedback, averageScore }); // Send average score in response
  } catch (error) {
    console.error("Error during evaluation:", error);
    res.status(500).json({ error: "An error occurred during evaluation." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
