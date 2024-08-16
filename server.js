const express = require("express");
const AWS = require("aws-sdk");
const { Buffer } = require("buffer");
require("dotenv").config(); // Ensure environment variables are loaded

const app = express();
const port = 3000;

// Configure AWS
AWS.config.update({
  region: "us-east-1", // Replace with your region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const textract = new AWS.Textract();

app.use(express.json({ limit: "50mb" })); // Increase limit to handle large image data

// Endpoint to handle image upload
app.post("/upload-selfie", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).send("No image data provided.");
  }

  // Extract Base64 data from image string
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  //const fileName = `image-${Date.now()}.jpg`;
  const fileName = `selfie.jpg`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: "image/jpg",
  };

  try {
    // Upload image to S3
    const s3Data = await s3.upload(params).promise();
    const imageUrl = s3Data.Location;

    res.json({
      imageUrl,
      fileName,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while uploading the image.");
  }
});

app.post("/upload-nid", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).send("No image data provided.");
  }

  // Extract Base64 data from image string
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  //const fileName = `image-${Date.now()}.jpg`;
  const fileName = `nid.jpg`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: "image/jpg",
  };

  try {
    // Upload image to S3
    const s3Data = await s3.upload(params).promise();
    const imageUrl = s3Data.Location;

    res.json({
      imageUrl,
      fileName,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while uploading the image.");
  }
});

// Detect Text API with FORMS and TABLES extraction
app.post("/detect-text", async (req, res) => {
  console.log("Endpoint /detect-text was hit."); // Log to verify endpoint is hit

  const { fileName } = req.body;

  // Log the received fileName
  console.log("Received fileName:", fileName);

  if (!fileName) {
    console.log("No fileName provided."); // Log when no fileName is provided
    return res.status(400).send("No file name provided.");
  }

  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Name: fileName,
      },
    },
    FeatureTypes: ["FORMS"], // Specify that we want to extract forms and tables
  };

  try {
    console.log("Calling Textract to analyze document...");
    let name, dob, nid;
    // Call Textract to analyze the document for forms and tables
    const textractData = await textract.analyzeDocument(params).promise();

    // Process or display the extracted text as needed

    const jsonData = textractData.Blocks;

    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    // Check if lineBlocks has elements before trying to access blocks
    if (lineBlocks.length > 0) {
      // Log all lineBlocks for debugging
      //console.log("lineBlocks...." + JSON.stringify(lineBlocks));

      // Get the last element in lineBlocks
      const lastLineBlock = lineBlocks[lineBlocks.length - 1];
      nid = lastLineBlock.Text;

      if (lineBlocks.length >= 3) {
        const blockBeforeLastTwo = lineBlocks[lineBlocks.length - 4];
        const dobText = blockBeforeLastTwo.Text;

        // Extract date part from the text
        const dobParts = dobText.split(" ");

        // Assuming the date part starts from the last three words
        if (dobParts.length >= 3) {
          dob = `${dobParts[dobParts.length - 3]} ${
            dobParts[dobParts.length - 2]
          } ${dobParts[dobParts.length - 1]}`;
        } else {
          // Handle cases where the expected date format is not found
          console.log("Date format is not as expected.");
          dob = dobText; // Fallback to the original text if extraction fails
        }

        console.log("Extracted Date of Birth: " + JSON.stringify(dob));
      } else {
        console.log(
          "Not enough blocks to find a block two positions before the last one."
        );
      }

      // Find the index of the block with Text === "Name"
      const nameBlockIndex = lineBlocks.findIndex(
        (block) => block.Text === "Name"
      );

      if (nameBlockIndex !== -1 && nameBlockIndex < lineBlocks.length - 1) {
        // Get the block after "Name"
        const nextBlock = lineBlocks[nameBlockIndex + 1];
        name = nextBlock.Text;
      } else if (nameBlockIndex === -1) {
        console.log("'Name' block not found.");
      } else {
        console.log("There is no block after the 'Name' block.");
      }
    } else {
      console.log("No lineBlocks found.");
    }

    // console.log("lineBlocks...." + JSON.stringify(lineBlocks));

    // Send the extracted data as the response
    res.json({
      name,
      dob,
      nid,
    });
  } catch (error) {
    console.error("Error occurred while analyzing document:", error); // Log the error if something goes wrong
    res.status(500).send("An error occurred while analyzing the document.");
  }
});

app.post("/compare-face", async (req, res) => {
  const { selfieUrl, nidUrl } = req.body;

  if (!selfieUrl || !nidUrl) {
    return res.status(400).send("Both image URLs are required.");
  }

  // Prepare parameters for Rekognition
  const params = {
    SourceImage: {
      S3Object: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Name: selfieUrl.split("/").pop(), // Extract file name from URL
      },
    },
    TargetImage: {
      S3Object: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Name: nidUrl.split("/").pop(), // Extract file name from URL
      },
    },
    SimilarityThreshold: 90, // Adjust as needed
  };

  try {
    // Call Rekognition to compare faces
    //const result = await rekognition.compareFaces(params).promise();
    //res.json(result);

    const result = await rekognition.compareFaces(params).promise();
    const faceMatches = result.FaceMatches;
    const matched = faceMatches.some((faceMatch) => faceMatch.Similarity >= 90); // Adjust threshold as needed

    res.json({
      matched,
      similarityScores: faceMatches.map((faceMatch) => faceMatch.Similarity),
      message: matched ? "Faces matched." : "Faces did not match.",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while comparing the images.");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
