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

const lexModelsV2 = new AWS.LexModelsV2();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Function to create a Lex v2 bot
async function createBot() {
  const botParams = {
    botName: "TestBot2V2",
    description: "A minimal test bot for Lex v2",
    roleArn:
      "arn:aws:iam::654654465357:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_myFaqBot",
    dataPrivacy: { childDirected: false },
    idleSessionTTLInSeconds: 300,
    botType: "Bot",
  };

  try {
    const botData = await lexModelsV2.createBot(botParams).promise();
    console.log("Bot created:", botData);
    return botData;
  } catch (error) {
    console.error("Error creating bot:", error);
    throw error;
  }
}

// Function to wait for bot creation to complete
async function waitForBotAvailable(botId) {
  while (true) {
    const botStatus = await lexModelsV2.describeBot({ botId }).promise();

    console.log("Current bot status:", botStatus.botStatus);

    if (botStatus.botStatus === "Available") {
      return;
    } else if (botStatus.botStatus === "Failed") {
      throw new Error("Bot creation failed.");
    }

    // Wait for a few seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// Function to create a Lex v2 bot locale
async function createBotLocale(botId) {
  const localeParams = {
    botId: botId,
    botVersion: "DRAFT",
    localeId: "en_US",
    nluIntentConfidenceThreshold: 0.4,
    voiceSettings: {
      voiceId: "Joanna",
    },
  };

  try {
    const localeData = await lexModelsV2
      .createBotLocale(localeParams)
      .promise();
    console.log("Locale created:", localeData);
    return localeData;
  } catch (error) {
    console.error("Error creating locale:", error);
    throw error;
  }
}

// Endpoint to create the bot and locale
app.post("/create-bot", async (req, res) => {
  try {
    const botData = await createBot();
    await waitForBotAvailable(botData.botId);
    const localeData = await createBotLocale(botData.botId);

    res.status(200).json({
      message: "Bot and locale created successfully",
      bot: botData,
      locale: localeData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create a custom slot type
app.post("/create-slot-type", async (req, res) => {
  const { botId, botVersion, localeId } = req.body;

  const slotTypeParams = {
    slotTypeName: "ColorSlotType",
    description: "A slot type for colors",
    valueSelectionSetting: {
      resolutionStrategy: "OriginalValue", // Corrected value
    },
    slotTypeValues: [
      { sampleValue: { value: "Red" } },
      { sampleValue: { value: "Green" } },
      { sampleValue: { value: "Blue" } },
    ],
    botId, // Added botId from request body
    botVersion, // Added botVersion from request body
    localeId, // Added localeId from request body
  };

  try {
    const slotTypeData = await lexModelsV2
      .createSlotType(slotTypeParams)
      .promise();
    console.log("Slot Type created:", slotTypeData);
    res
      .status(200)
      .json({ message: "Slot type created successfully", slotTypeData });
  } catch (error) {
    console.error("Error creating slot type:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create a slot
app.post("/create-slot", async (req, res) => {
  const { botId, botVersion, localeId, intentId, slotTypeId, slotName } =
    req.body;

  const slotParams = {
    botId,
    botVersion,
    localeId,
    intentId,
    slotName, // The name of the slot you want to create
    description: "A slot to capture user's favorite color",
    slotTypeId, // The slot type ID created from create-slot-type endpoint
    valueElicitationSetting: {
      slotConstraint: "Required", // Can be "Required" or "Optional"
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What is your favorite color?",
              },
            },
          },
        ],
        maxRetries: 2,
        allowInterrupt: true,
      },
    },
  };

  try {
    const slotData = await lexModelsV2.createSlot(slotParams).promise();
    console.log("Slot created:", slotData);
    res.status(200).json({ message: "Slot created successfully", slotData });
  } catch (error) {
    console.error("Error creating slot:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create an intent
app.post("/create-intent", async (req, res) => {
  console.log("Request body:", req.body); // Log the request body

  const { botId, botVersion, localeId } = req.body;

  if (!botId || !botVersion || !localeId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Define the intent parameters including slots
  const intentParams = {
    botId,
    botVersion,
    localeId,
    intentName: "ColorIntent",
    description: "An intent to get the user's favorite color",
    dialogCodeHook: {
      enabled: false, // Set to true if you have a dialog code hook
    },
    sampleUtterances: [
      { utterance: "What is your favorite color?" },
      { utterance: "My favorite color is {Color}" }, // Correct usage of slot
    ],
  };

  try {
    const intentData = await lexModelsV2.createIntent(intentParams).promise();
    console.log("Intent created:", intentData);
    res
      .status(200)
      .json({ message: "Intent created successfully", intentData });
  } catch (error) {
    console.error("Error creating intent:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
