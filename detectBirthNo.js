const AWS = require("aws-sdk");

const textract = new AWS.Textract();

exports.handler = async (event) => {
  console.log("Lambda function was invoked.");

  const { fileName } = JSON.parse(event.body);

  if (!fileName) {
    console.log("No fileName provided.");
    return {
      statusCode: 400,
      body: JSON.stringify("No file name provided."),
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

  try {
    console.log("Calling Textract to detect text...");

    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;

    // Filter blocks to get lines of text
    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    // Find the line that contains "Birth Registration No:"
    const relevantLine = lineBlocks.find((lineBlock) =>
      lineBlock.Text.includes("Birth Registration No:")
    );

    // Define a regular expression to extract numbers
    const numberRegex = /\d+/g;

    // Extract the birth registration number
    const birthRegNo = relevantLine
      ? relevantLine.Text.match(numberRegex).join("")
      : null;

    if (birthRegNo) {
      console.log("Extracted data:", { data: { birthRegNo } });
      return {
        statusCode: 200,
        body: JSON.stringify({ data: { birthRegNo } }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify("Birth Registration Number not found."),
      };
    }
  } catch (error) {
    console.error("Error occurred while detecting text:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("An error occurred while detecting text."),
    };
  }
};
