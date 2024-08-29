const express = require("express");
const AWS = require("aws-sdk");
const { Buffer } = require("buffer");
const axios = require("axios");

require("dotenv").config(); // Ensure environment variables are loaded

const app = express();
const port = 3000;

// Configure AWS
AWS.config.update({
  region: "us-east-1",
  accessKeyId: process.env.YOUR_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.YOUR_AWS_SECRET_ACCESS_KEY,
});
const textract = new AWS.Textract();
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

app.use(express.json({ limit: "50mb" }));

const BankData = require("./data/BankData");

const findBankDistrictAndBranch = (routingNumber) => {
  // Ensure routingNumber is a string
  if (typeof routingNumber !== "string") {
    console.error("Invalid routingNumber type");
    return null;
  }

  // Remove the last digit
  let trimmedRoutingNumber = routingNumber.slice(0, -1);
  console.log("Trimmed Routing Number:", trimmedRoutingNumber);

  // Check if trimmedRoutingNumber is in the correct length
  if (trimmedRoutingNumber.length < 8) {
    console.error("Invalid trimmedRoutingNumber length");
    return null;
  }

  // Split into three parts
  const bankCode = trimmedRoutingNumber.slice(0, 3);
  const districtCode = trimmedRoutingNumber.slice(3, 5);
  const branchCode = trimmedRoutingNumber.slice(5);
  console.log("Bank Code:", bankCode);
  console.log("District Code:", districtCode);
  console.log("Branch Code:", branchCode);

  // Find the bank
  const bank = BankData.banks.find((bank) => bank.bankCode === bankCode);
  console.log("Bank Found:", bank);

  if (!bank) {
    console.error("Bank not found");
    return null;
  }

  // // Find the district within the bank
  const district = bank.districts.find(
    (district) => district.districtCode === districtCode
  );
  console.log("District Found:", district);

  if (!district) {
    console.error("District not found");
    return null;
  }

  // // Find the branch within the district
  const branch = district.branches.find(
    (branch) => branch.branchCode === branchCode
  );
  console.log("Branch Found:", branch);

  if (!branch) {
    console.error("Branch not found");
    return null;
  }

  return {
    bankName: bank.name,
    districtName: district.name,
    branchName: branch.name,
  };
};

app.post("/autofill-bank-info", async (req, res) => {
  console.log("Endpoint /autofill-bank-info was hit.");

  const { routingNumber } = req.body;

  if (!routingNumber) {
    console.log("No routing number provided.");
    return res.status(400).send("No routing number provided.");
  }

  console.log("routingNumber: " + routingNumber);

  const result = findBankDistrictAndBranch(routingNumber);
  console.log(result);

  if (!result) {
    return res
      .status(404)
      .send("Bank information not found for the given routing number.");
  }

  console.log("Bank information found:", result);
  return res.json(result);
});

app.post("/extract-cheque", async (req, res) => {
  console.log("Endpoint /detect-bank was hit.");

  const { fileName } = req.body;

  if (!fileName) {
    console.log("No fileName provided.");
    return res.status(400).send("No file name provided.");
  }

  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.YOUR_S3_BUCKET_NAME,
        Name: fileName,
      },
    },
  };

  removeNonNumeric = (text) => {
    return text.replace(/\D/g, "");
  };
  try {
    console.log("Calling Textract to detect text...");
    // Initialize variables and set default to null
    let routingNumber = null;
    let accountNumber = null;

    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;

    // Filter blocks to get lines of text
    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    const lastLineBlock =
      lineBlocks.length > 0 ? lineBlocks[lineBlocks.length - 1] : null;

    const lastlinechunks = lastLineBlock.Text.split(" ");
    //console.log(lastlinechunks);

    routingNumber = removeNonNumeric(lastlinechunks[1]);
    accountNumber = removeNonNumeric(lastlinechunks[2]);

    // Determine success status
    const success = routingNumber !== null && accountNumber !== null;

    if (!success) {
      console.log("Failed to detect one or more fields.");
    }

    // Return the status and detected values
    res.json({
      status: success ? "success" : "fail",
      chequeExtractData: {
        routingNumber,
        accountNumber,
      },
    });
  } catch (error) {
    console.error("Error occurred while detecting text:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while detecting text.",
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
