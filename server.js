const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = 3000;

// Configure AWS
AWS.config.update({
  region: "us-east-1",
  accessKeyId: process.env.YOUR_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.YOUR_AWS_SECRET_ACCESS_KEY,
});

const lexModels = new AWS.LexModelBuildingService();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Function to create or update an abort intent
async function createOrUpdateAbortIntent() {
  const intentName = "AbortIntent";

  let currentIntent;
  try {
    currentIntent = await lexModels
      .getIntent({ name: intentName, version: "$LATEST" })
      .promise();
  } catch (error) {
    if (error.code !== "NotFoundException") {
      console.error("Error retrieving abort intent:", error);
      throw error;
    }
  }

  const intentParams = {
    name: intentName,
    sampleUtterances: ["Stop", "Cancel", "Never mind", "Forget it"],
    fulfillmentActivity: { type: "ReturnIntent" },
  };

  // If the intent exists, include the checksum
  if (currentIntent) {
    intentParams.checksum = currentIntent.checksum;
  }

  try {
    const intentData = await lexModels.putIntent(intentParams).promise();
    console.log("Abort Intent created/updated:", intentData);
    return intentData;
  } catch (error) {
    console.error("Error creating/updating abort intent:", error);
    throw error;
  }
}

async function createOrUpdateBot() {
  const botName = "TestBot";

  // First, get the current bot details to retrieve the checksum
  let currentBot;
  try {
    currentBot = await lexModels
      .getBot({ name: botName, versionOrAlias: "$LATEST" })
      .promise();
  } catch (error) {
    if (error.code !== "NotFoundException") {
      console.error("Error retrieving bot:", error);
      throw error;
    }
  }

  const botParams = {
    name: botName,
    description: "A minimal test bot",
    intents: [
      { intentName: "HelloIntent", intentVersion: "$LATEST" },
      { intentName: "AbortIntent", intentVersion: "$LATEST" }, // Ensure AbortIntent is included
    ],
    locale: "en-US",
    childDirected: false,
    processBehavior: "BUILD",
    voiceId: "Joanna",
    abortStatement: {
      messages: [
        {
          contentType: "PlainText",
          content: "Okay, I've canceled your request.",
        },
      ],
    },
  };

  // If the bot exists, include the checksum
  if (currentBot) {
    botParams.checksum = currentBot.checksum;
  }

  try {
    const botData = await lexModels.putBot(botParams).promise();
    console.log("Bot created/updated:", botData);
    return botData;
  } catch (error) {
    console.error("Error creating/updating bot:", error);
    throw error;
  }
}

// Function to create or update an intent
async function createOrUpdateIntent() {
  const intentName = "HelloIntent";

  let currentIntent;
  try {
    currentIntent = await lexModels
      .getIntent({ name: intentName, version: "$LATEST" })
      .promise();
  } catch (error) {
    if (error.code !== "NotFoundException") {
      console.error("Error retrieving intent:", error);
      throw error;
    }
  }

  const intentParams = {
    name: intentName,
    sampleUtterances: ["Hello", "Hi", "I want to talk to the bot"],
    slots: [],
    fulfillmentActivity: {
      type: "ReturnIntent",
    },
  };

  // If the intent exists, include the checksum
  if (currentIntent) {
    intentParams.checksum = currentIntent.checksum;
  }

  try {
    const intentData = await lexModels.putIntent(intentParams).promise();
    console.log("Intent created/updated:", intentData);
    return intentData;
  } catch (error) {
    console.error("Error creating/updating intent:", error);
    throw error;
  }
}

// Endpoint to create or update the bot and intents
app.post("/create-bot", async (req, res) => {
  try {
    await createOrUpdateAbortIntent(); // Ensure AbortIntent is created/updated
    const bot = await createOrUpdateBot();
    const intent = await createOrUpdateIntent();
    res.status(200).json({
      message: "Bot and intents created/updated successfully",
      bot,
      intent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to check the bot status
app.get("/bot-status", async (req, res) => {
  try {
    const botData = await lexModels
      .getBot({ name: "TestBot", versionOrAlias: "$LATEST" })
      .promise();
    res.status(200).json(botData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Express server on port 3000
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
