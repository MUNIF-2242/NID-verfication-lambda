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

  const removeNonNumeric = (text) => {
    return text.replace(/\D/g, "");
  };

  try {
    let routingNumber = null;
    let accountNumber = null;

    const textractData = await textract.detectDocumentText(params).promise();
    const jsonData = textractData.Blocks;

    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    const sortedLines = lineBlocks.sort(
      (a, b) => b.Text.length - a.Text.length
    );

    let longestLineBlock = lineBlocks.reduce((longest, current) => {
      return current.Text.length > longest.Text.length ? current : longest;
    }, lineBlocks[0]);

    const secondLongestLineBlock = sortedLines.find((line, index) => {
      const numericCount = removeNonNumeric(line.Text).length;
      return index !== 0 && numericCount > 10;
    });

    const secondLongestLineText = secondLongestLineBlock.Text;

    const lineChunks = longestLineBlock.Text.split(" ");

    routingNumber = removeNonNumeric(lineChunks[1] || "");
    accountNumber = removeNonNumeric(secondLongestLineText);

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
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "error",
        message: "An error occurred while detecting text.",
      }),
    };
  }
};
