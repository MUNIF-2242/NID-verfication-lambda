const AWS = require("aws-sdk");
const textract = new AWS.Textract();

exports.handler = async (event) => {
  console.log("Lambda /extract-cheque invoked.");

  const { fileName } = JSON.parse(event.body);

  if (!fileName) {
    console.log("No fileName provided.");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No file name provided." }),
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

  const removeNonNumeric = (text) => {
    return text.replace(/\D/g, "");
  };

  try {
    console.log("Calling Textract to detect text...");

    let routingNumber = null;
    let accountNumber = null;

    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;

    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    const lastLineBlock =
      lineBlocks.length > 0 ? lineBlocks[lineBlocks.length - 1] : null;

    if (lastLineBlock) {
      const lastlinechunks = lastLineBlock.Text.split(" ");
      routingNumber = removeNonNumeric(lastlinechunks[1]);
      accountNumber = removeNonNumeric(lastlinechunks[2]);
    }

    const success = routingNumber !== null && accountNumber !== null;

    if (!success) {
      console.log("Failed to detect one or more fields.");
    }

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
