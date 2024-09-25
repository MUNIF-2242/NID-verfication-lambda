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

const BankData = require("./data/BankDataDhakaBank");

app.post("/bank-details", async (req, res) => {
  console.log("Endpoint /bank-details was hit.");

  const findBankDistrictAndBranch = (routingNumber) => {
    // Ensure routingNumber is a string
    if (typeof routingNumber !== "string") {
      console.error("Invalid routingNumber type");
      return null;
    }

    // Remove the last digit
    let trimmedRoutingNumber = routingNumber.slice(0, -1);
    //console.log("Trimmed Routing Number:", trimmedRoutingNumber);

    // Check if trimmedRoutingNumber is in the correct length
    if (trimmedRoutingNumber.length < 8) {
      console.error("Invalid trimmedRoutingNumber length");
      return null;
    }

    // Split into three parts
    const bankCode = trimmedRoutingNumber.slice(0, 3);
    const districtCode = trimmedRoutingNumber.slice(3, 5);
    const branchCode = trimmedRoutingNumber.slice(5);
    // console.log("Bank Code:", bankCode);
    // console.log("District Code:", districtCode);
    // console.log("Branch Code:", branchCode);

    // Find the bank
    const bank = BankData.banks.find((bank) => bank.bankCode === bankCode);
    //console.log("Bank Found:", bank);

    if (!bank) {
      console.error("Bank not found");
      return null;
    }

    // Find the district within the bank
    const district = bank.districts.find(
      (district) => district.districtCode === districtCode
    );
    //console.log("District Found:", district);

    if (!district) {
      console.error("District not found");
      return null;
    }

    // Find the branch within the district
    const branch = district.branches.find(
      (branch) => branch.branchCode === branchCode
    );
    //console.log("Branch Found:", branch);

    if (!branch) {
      console.error("Branch not found");
      return null;
    }

    return {
      bankName: bank.name,
      districtName: district.name,
      branchName: branch.name,
      routingNumber,
    };
  };

  const { routingNumber } = req.body;

  if (!routingNumber) {
    console.log("No routing number provided.");
    return res.status(400).send("No routing number provided.");
  }

  //console.log("routingNumber: " + routingNumber);

  const result = findBankDistrictAndBranch(routingNumber);
  //console.log(result);

  if (!result) {
    return res
      .status(404)
      .send("Bank information not found for the given routing number.");
  }

  //console.log("Bank information found:", result);
  return res.status(200).json({
    status: "success",
    bankDetails: result,
  });
});

app.post("/extract-cheque", async (req, res) => {
  console.log("Endpoint /extract-cheque was hit.");

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

  // Function to remove non-numeric characters
  const removeNonNumeric = (text) => {
    return text.replace(/\D/g, "");
  };

  try {
    console.log("Calling Textract to detect text...");
    let routingNumber = null;
    let accountNumber = null;

    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;
    //console.log("jsonData:", jsonData);

    // Filter blocks to get lines of text
    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    // Find the longest line that contains more than 11 numeric characters
    let longestLineBlock = null;
    let secondLongestLineBlock = null;

    for (const lineBlock of lineBlocks) {
      const numericCount = removeNonNumeric(lineBlock.Text).length;

      // Check for longest line block with numeric count >= 11
      if (numericCount >= 11) {
        if (
          !longestLineBlock ||
          lineBlock.Text.length > longestLineBlock.Text.length
        ) {
          // Update second longest before updating longest
          secondLongestLineBlock = longestLineBlock;
          longestLineBlock = lineBlock;
        } else if (
          !secondLongestLineBlock ||
          lineBlock.Text.length > secondLongestLineBlock.Text.length
        ) {
          secondLongestLineBlock = lineBlock;
        }
      }
    }

    // console.log("longestLineBlock:", longestLineBlock);
    // console.log("secondLongestLineBlock:", secondLongestLineBlock);

    // Assuming the longest line contains routing and account numbers
    const lineChunks = longestLineBlock ? longestLineBlock.Text.split(" ") : [];

    // Extract routing and account numbers
    routingNumber = removeNonNumeric(lineChunks[1] || "");
    accountNumber = secondLongestLineBlock
      ? removeNonNumeric(secondLongestLineBlock.Text)
      : null;

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

app.post("/upload-cheque", async (req, res) => {
  console.log("caal upload");
  const { image } = req.body;

  if (!image) {
    return res.status(400).send("No image data provided.");
  }

  // Extract Base64 data from image string
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  //const fileName = `image-${Date.now()}.jpg`;
  const fileName = `bank.jpg`;
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

  // Function to format date to YYYY-MM-DD
  function formatDateToISO(dateMatchArray) {
    const [_, day, month, year] = dateMatchArray;
    return `${year}-${month}-${day}`;
  }

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

    //console.log(lineBlocks);

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

app.post("/detect-text", async (req, res) => {
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

    // Initialize variables and set default to null
    let dob = null;
    let name = null;
    let nid = null;

    // Find Date of Birth using a case-insensitive search
    const dobLine = lineBlocks.find((lineBlock) =>
      lineBlock.Text.includes("Date of Birth")
    );

    if (dobLine) {
      const dobMatch = dobLine.Text.match(/\d{2} \w{3} \d{4}/);
      if (dobMatch) {
        dob = dobMatch[0];
        console.log("DOB:", dob);
      } else {
        console.log("Date of Birth pattern not found");
      }
    } else {
      console.log("DOB line not found");
    }

    // Find the index of the block that includes the text "Name"
    lineBlocks.forEach((block, index) => {
      if (block.Text.includes("Name")) {
        nameBlockIndex = index;
      }
      if (block.Text.includes("NID No")) {
        nidBlockIndex = index;
      }
    });

    // Set the name value if the "Name" block is found and there's a next block
    if (nameBlockIndex !== -1 && nameBlockIndex < lineBlocks.length - 1) {
      const nextBlock = lineBlocks[nameBlockIndex + 1];
      name = nextBlock.Text;
      console.log("Next Block Text (Name):", name);
    }

    // Set the nid value if the "NID No." block is found and there's a next block
    if (nidBlockIndex !== -1 && nidBlockIndex < lineBlocks.length - 1) {
      const nextBlock = lineBlocks[nidBlockIndex + 1];
      nid = nextBlock.Text;
      console.log("Next Block Text (NID No.):", nid);
    }

    // Fallback to null if any value is undefined
    dob = dob !== undefined ? dob : null;
    name = name !== undefined ? name : null;
    nid = nid !== undefined ? nid : null;

    // Determine success status
    const success = dob !== null && name !== null && nid !== null;

    if (!success) {
      console.log("Failed to detect one or more fields.");
    }

    // Return the status and detected values
    res.json({
      status: success ? "success" : "fail",
      nidData: {
        dob,
        name,
        nid,
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

app.post("/analyze-passport", async (req, res) => {
  console.log("Endpoint /analyze-passport was hit.");

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

  const getRequiredFields = (mrzFields) => {
    return {
      passportNumber: mrzFields.passportNumber || null,
      birthDate: mrzFields.birthDate ? formatDate(mrzFields.birthDate) : null,
      expirationDate: mrzFields.expirationDate
        ? formatDate(mrzFields.expirationDate)
        : null,
      personalNumber: mrzFields.personalNumber
        ? mrzFields.personalNumber.substring(0, 10)
        : null,
    };
  };

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).send("No image URL provided.");
  }

  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.YOUR_S3_BUCKET_NAME,
        Name: imageUrl.split("/").pop(),
      },
    },
  };

  try {
    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;

    // Filter blocks to get lines of text
    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    // Initialize variables and set defaults to null
    let name = null;
    const nameMrzLine =
      lineBlocks.length > 1 ? lineBlocks[lineBlocks.length - 2] : null;

    const extractNameFromMRZ = (mrzLine) => {
      if (!mrzLine) return null;
      let cleanedLine = mrzLine.replace(/^P</, "").replace(/</g, " ").trim();
      let nameParts = cleanedLine.split(/\s+/);
      let lastName = nameParts[0].replace(/^BGD/, ""); // Remove "BGD" from the last name if it exists
      let givenNames = nameParts.slice(1).join(""); // Join the rest as given names
      return `${givenNames}${lastName}`.toUpperCase();
    };

    if (nameMrzLine) {
      name = extractNameFromMRZ(nameMrzLine.Text) || null;
      console.log("Name:", name);
    } else {
      console.log("Name MRZ line not found.");
    }

    const lastLineBlock =
      lineBlocks.length > 0 ? lineBlocks[lineBlocks.length - 1] : null;
    const mrzCodeText = lastLineBlock ? lastLineBlock.Text : null;

    if (mrzCodeText) {
      const mrzFields = extractMRZFields(mrzCodeText);
      const responseData = getRequiredFields(mrzFields);

      responseData.name = name;

      const success = Object.values(responseData).every(
        (value) => value !== null
      );

      res.json({
        status: success ? "success" : "fail",
        passportData: responseData,
      });
    } else {
      res.status(404).send("MRZ code not found.");
    }
  } catch (error) {
    console.error("Textract error:", error);
    res.status(500).send("An error occurred while analyzing the document.");
  }
});

// Start Express server on port 3000
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
