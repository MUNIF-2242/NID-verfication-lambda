const AWS = require("aws-sdk");
const textract = new AWS.Textract();

exports.handler = async (event) => {
  const { fileName } = JSON.parse(event.body);

  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "error",
        message: "No file name provided.",
      }),
    };
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
    let routingNumber = null;
    let accountNumber = null;

    // Call Textract to detect document text
    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;

    // Filter blocks to get lines of text
    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    let longestLineBlock = null;
    let secondLongestLineBlock = null;
    for (const lineBlock of lineBlocks) {
      const numericCount = removeNonNumeric(lineBlock.Text).length;
      if (numericCount >= 11) {
        if (
          !longestLineBlock ||
          lineBlock.Text.length > longestLineBlock.Text.length
        ) {
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

    // Handle case where no valid blocks are found
    if (!longestLineBlock || !secondLongestLineBlock) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "fail",
          message: "Could not detect required text fields.",
        }),
      };
    }

    // Pass the longest line block text to lineChunks without modification
    const lineChunks = longestLineBlock ? longestLineBlock.Text.split(" ") : [];

    // Extract routing and account numbers
    routingNumber = removeNonNumeric(lineChunks[1] || "");
    accountNumber = removeNonNumeric(secondLongestLineBlock.Text);

    // Determine success status
    const success = routingNumber !== null && accountNumber !== null;

    // Return the status and detected values
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: success ? "success" : "fail",
        chequeExtractData: {
          routingNumber,
          accountNumber,
        },
      }),
    };
  } catch (error) {
    console.error("Error occurred while detecting text:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "error",
        message: "An error occurred while detecting text.",
      }),
    };
  }
};
