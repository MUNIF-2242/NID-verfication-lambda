const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for cross-origin requests

// Initialize AWS Rekognition
const rekognition = new AWS.Rekognition({
  region: "us-east-1",
  accessKeyId: process.env.YOUR_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.YOUR_AWS_SECRET_ACCESS_KEY,
});

// Liveness Detection Route
app.post("/detect-liveness", async (req, res) => {
  try {
    const createSessionParams = {
      ClientRequestToken: "unique-request-token-" + Date.now(),
    };

    const sessionData = await rekognition
      .createFaceLivenessSession(createSessionParams)
      .promise();
    const sessionId = sessionData.SessionId;

    console.log("Session created:", sessionId);

    const getSessionResultsParams = {
      SessionId: sessionId,
    };

    const livenessResults = await rekognition
      .getFaceLivenessSessionResults(getSessionResultsParams)
      .promise();
    console.log("Liveness results:", JSON.stringify(livenessResults, null, 2));

    res.json(livenessResults);
  } catch (err) {
    console.error("Error during face liveness detection:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
