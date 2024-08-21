const express = require("express");
const AWS = require("aws-sdk");
const { Buffer } = require("buffer");
const { axios } = require("axios");
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

app.post("/upload-birth", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).send("No image data provided.");
  }

  // Extract Base64 data from image string
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  //const fileName = `image-${Date.now()}.jpg`;
  const fileName = `birth.jpg`;
  const params = {
    Bucket: process.env.YOUR_S3_BUCKET_NAME,
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

app.post("/detect-birthno", async (req, res) => {
  console.log("Endpoint /detect-text was hit.");

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

  try {
    console.log("Calling Textract to detect text...");

    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;

    // Filter blocks to get lines of text
    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    console.log(lineBlocks);

    // Find the line that contains "Birth Registration No:"
    const birthRegNoLine = lineBlocks.find((lineBlock) =>
      lineBlock.Text.includes("Birth Registration No:")
    );

    // Find the line that contains "Date of Birth:"
    const dobLine = lineBlocks.find((lineBlock) =>
      lineBlock.Text.includes("Date of Birth:")
    );

    // Define a regular expression to extract numbers
    const numberRegex = /\d+/g;

    // Define a regular expression to extract date in the format dd-mm-yyyy or similar
    const dateRegex = /(\d{2})[-\/](\d{2})[-\/](\d{4})/;

    // Extract the birth registration number
    const birthRegNo = birthRegNoLine
      ? birthRegNoLine.Text.match(numberRegex).join("")
      : null;

    // Extract the date of birth and format it to YYYY-MM-DD
    const dob = dobLine
      ? dobLine.Text.match(dateRegex)
        ? formatDateToISO(dobLine.Text.match(dateRegex))
        : null
      : null;

    if (birthRegNo || dob) {
      console.log("Extracted data:", { data: { birthRegNo, dob } });
      res.json({
        data: { birthRegistrationNumber: birthRegNo, dateOfBirth: dob },
      });
    } else {
      res
        .status(404)
        .send("Birth Registration Number or Date of Birth not found.");
    }
  } catch (error) {
    console.error("Error occurred while detecting text:", error);
    res.status(500).send("An error occurred while detecting text.");
  }
});

// Function to format date to YYYY-MM-DD
function formatDateToISO(dateMatchArray) {
  const [_, day, month, year] = dateMatchArray;
  return `${year}-${month}-${day}`;
}

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
    Bucket: process.env.YOUR_S3_BUCKET_NAME,
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
    Bucket: process.env.YOUR_S3_BUCKET_NAME,
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
        Bucket: process.env.YOUR_S3_BUCKET_NAME,
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
        Bucket: process.env.YOUR_S3_BUCKET_NAME,
        Name: selfieUrl.split("/").pop(), // Extract file name from URL
      },
    },
    TargetImage: {
      S3Object: {
        Bucket: process.env.YOUR_S3_BUCKET_NAME,
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

app.post("/detect-face", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).send("No image URL provided.");
  }

  // Extract the bucket name and key from the imageUrl
  const bucketName = process.env.YOUR_S3_BUCKET_NAME;

  const key = imageUrl.split("/").pop(); // Fixing the key extraction

  if (!key) {
    return res.status(400).send("Invalid image URL provided.");
  }

  const params = {
    Image: {
      S3Object: {
        Bucket: bucketName,
        Name: key,
      },
    },
    Attributes: ["ALL"], // Return all facial attributes
  };

  try {
    // Detect faces using AWS Rekognition
    const rekognitionData = await rekognition.detectFaces(params).promise();

    if (rekognitionData.FaceDetails && rekognitionData.FaceDetails.length > 0) {
      // Face(s) detected
      res.json({
        faceDetected: true,
        message: "Face detected successfully.",
        details: rekognitionData.FaceDetails,
      });
    } else {
      // No faces detected
      res.json({
        faceDetected: false,
        message: "No face detected in the image.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while detecting faces.");
  }
});

app.post("/porichoy-basic", async (req, res) => {
  const convertDateFormat = (dateString) => {
    // Define the month abbreviations
    const months = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    // Split the input date string
    const [day, monthAbbr, year] = dateString.split(" ");

    // Convert the month abbreviation to month number
    const month = months[monthAbbr];

    // Return the date in YYYY-MM-DD format
    return `${year}-${month}-${day.padStart(2, "0")}`;
  };

  const { name, dob, nid } = req.body;

  try {
    const requestData = {
      national_id: nid,
      person_dob: convertDateFormat(dob),
      person_fullname: name,
    };

    console.log("Transformed data for....", requestData);

    // Call /api/v2/verifications/basic-nid with the transformed data
    try {
      const verificationResponse = await axios.post(
        "https://api.porichoybd.com/api/v2/verifications/basic-nid",
        requestData,
        {
          headers: {
            "x-api-key": process.env.YOUR_PORICHOY_API_KEY, // Set your API key here
          },
        }
      );

      // Send the response from the verification API
      res.json(verificationResponse.data);
    } catch (verificationError) {
      console.error(
        "Error occurred while calling verification API:",
        verificationError
      );
      res
        .status(500)
        .send("An error occurred while calling the verification API.");
    }
  } catch (detectTextError) {
    console.error(
      "Error occurred while calling /detect-text:",
      detectTextError
    );
    res.status(500).send("An error occurred while analyzing the document.");
  }
});

app.post("/porichoy-birth", async (req, res) => {
  const { birthRegistrationNumber, dateOfBirth } = req.body;

  try {
    const requestData = {
      birthRegistrationNumber,
      dateOfBirth,
    };

    console.log("Transformed data for....", requestData);

    // Call /api/v2/verifications/basic-nid with the transformed data
    try {
      const verificationResponse = await axios.post(
        "https://api.porichoybd.com/api/v1/verifications/autofill",
        requestData,
        {
          headers: {
            "x-api-key": process.env.YOUR_PORICHOY_API_KEY, // Set your API key here
          },
        }
      );

      // Send the response from the verification API
      res.json(verificationResponse.data);
    } catch (verificationError) {
      console.error(
        "Error occurred while calling verification API:",
        verificationError
      );
      res
        .status(500)
        .send("An error occurred while calling the verification API.");
    }
  } catch (detectTextError) {
    console.error(
      "Error occurred while calling /detect-text:",
      detectTextError
    );
    res.status(500).send("An error occurred while analyzing the document.");
  }
});
// Endpoint to upload passport
app.post("/upload-passport", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).send("No image data provided.");
  }

  // Extract Base64 data from image string
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  //const fileName = `image-${Date.now()}.jpg`;
  const fileName = `passport.jpg`;
  const params = {
    Bucket: process.env.YOUR_S3_BUCKET_NAME,
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

// Endpoint to analyze document using Textract
app.post("/analyze-passport", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).send("No image URL provided.");
  }

  const params = {
    DocumentPages: [
      {
        S3Object: {
          Bucket: process.env.YOUR_S3_BUCKET_NAME,
          Name: imageUrl.split("/").pop(),
        },
      },
    ],
  };

  try {
    const response = await textract.analyzeID(params).promise();
    const identityDocumentFields =
      response.IdentityDocuments[0].IdentityDocumentFields;

    let mrzCodeText = null;
    for (let field of identityDocumentFields) {
      if (field?.Type?.Text === "MRZ_CODE") {
        let mrzCodeFull = field?.ValueDetection?.Text;
        console.log("mrzCodeText" + mrzCodeFull);
        if (mrzCodeFull) {
          const mrzLines = mrzCodeFull.split("\n");
          const mrzLastLine = mrzLines[mrzLines.length - 1];
          mrzCodeText = mrzLastLine;
          break;
        }
      }
    }

    if (mrzCodeText) {
      const result = validateMRZ(mrzCodeText);

      // Extract all MRZ fields
      const mrzFields = extractMRZFields(mrzCodeText);

      // Use only the required fields for response
      const responseData = getRequiredFields(mrzFields);

      res.json({
        responseData,
        passportVerificationStatus: result.isPassportValid,
      });
    } else {
      res.status(404).send("MRZ code not found.");
    }
  } catch (error) {
    console.error("Textract error:", error);
    res.status(500).send("An error occurred while analyzing the document.");
  }
});
const formatDate = (yyMMdd) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const year = parseInt(yyMMdd.substring(0, 2), 10);
  const month = parseInt(yyMMdd.substring(2, 4), 10) - 1;
  const day = parseInt(yyMMdd.substring(4, 6), 10);

  const fullYear = year >= 50 ? 1900 + year : 2000 + year;
  return `${day} ${monthNames[month]} ${fullYear}`;
};

const getCharacterValue = (char) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (char >= "0" && char <= "9") {
    return parseInt(char);
  } else if (char >= "A" && char <= "Z") {
    return alphabet.indexOf(char) + 10;
  } else {
    return 0; // Placeholder < is treated as 0
  }
};

const calculateCheckDigit = (input) => {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < input.length; i++) {
    const value = getCharacterValue(input[i]);
    sum += value * weights[i % 3];
  }

  return sum % 10;
};

const parseDate = (yyMMdd) => {
  const year = parseInt(yyMMdd.substring(0, 2), 10);
  const month = parseInt(yyMMdd.substring(2, 4), 10) - 1;
  const day = parseInt(yyMMdd.substring(4, 6), 10);

  const fullYear = year >= 50 ? 1900 + year : 2000 + year;

  return new Date(fullYear, month, day);
};

const extractMRZFields = (mrz) => {
  return {
    passportNumber: mrz.substring(0, 9),
    passportNumberCheckDigit: parseInt(mrz[9]),
    birthDate: mrz.substring(13, 19),
    birthDateCheckDigit: parseInt(mrz[19]),
    expirationDate: mrz.substring(21, 27),
    expirationDateCheckDigit: parseInt(mrz[27]),
    personalNumber: mrz.substring(28, 42),
    personalNumberCheckDigit: parseInt(mrz[42]),
    finalCheckDigit: parseInt(mrz[43]),
  };
};

// Function to get only required fields for response
const getRequiredFields = (mrzFields) => {
  return {
    passportNumber: mrzFields.passportNumber,
    birthDate: formatDate(mrzFields.birthDate),
    expirationDate: formatDate(mrzFields.expirationDate),
    personalNumber: mrzFields.personalNumber.substring(0, 10),
  };
};

const validateMRZ = (mrz) => {
  console.log("ValidateMRZ" + mrz);
  if (!mrz) {
    // console.error("MRZ code is null or undefined");
    return {
      isPassportNumberValid: false,
      isBirthDateValid: false,
      isExpirationDateValid: false,
      isPersonalNumberValid: false,
      isFinalCheckDigitValid: false,
      isExpirationDateNotExpired: false,
      isPassportValid: false,
    };
  }
  const {
    passportNumber,
    passportNumberCheckDigit,
    birthDate,
    birthDateCheckDigit,
    expirationDate,
    expirationDateCheckDigit,
    personalNumber,
    personalNumberCheckDigit,
    finalCheckDigit,
  } = extractMRZFields(mrz);

  const isPassportNumberValid =
    calculateCheckDigit(passportNumber) === passportNumberCheckDigit;
  const isBirthDateValid =
    calculateCheckDigit(birthDate) === birthDateCheckDigit;
  const isExpirationDateValid =
    calculateCheckDigit(expirationDate) === expirationDateCheckDigit;
  const isPersonalNumberValid =
    calculateCheckDigit(personalNumber) === personalNumberCheckDigit;

  const expirationDateObj = parseDate(expirationDate);
  const currentDate = new Date();
  const isExpirationDateNotExpired = expirationDateObj >= currentDate;

  const combined =
    passportNumber +
    passportNumberCheckDigit +
    birthDate +
    birthDateCheckDigit +
    expirationDate +
    expirationDateCheckDigit +
    personalNumber +
    personalNumberCheckDigit;
  const isFinalCheckDigitValid =
    calculateCheckDigit(combined) === finalCheckDigit;

  const isPassportValid =
    isPassportNumberValid &&
    isBirthDateValid &&
    isExpirationDateValid &&
    isPersonalNumberValid &&
    isFinalCheckDigitValid &&
    isExpirationDateNotExpired;

  return {
    isPassportNumberValid,
    isBirthDateValid,
    isExpirationDateValid,
    isPersonalNumberValid,
    isFinalCheckDigitValid,
    isExpirationDateNotExpired,
    isPassportValid,
  };
};

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
