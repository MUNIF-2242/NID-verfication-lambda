const AWS = require("aws-sdk");
const textract = new AWS.Textract();

exports.handler = async (event) => {
  console.log("Lambda function invoked for /detect-text");

  let response;
  const { fileName } = JSON.parse(event.body);

  console.log("Received fileName:", fileName);

  if (!fileName) {
    console.log("No fileName provided.");
    response = {
      statusCode: 400,
      body: JSON.stringify("No file name provided."),
    };
    return response;
  }

  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.YOUR_S3_BUCKET_NAME,
        Name: fileName,
      },
    },
    FeatureTypes: ["FORMS"],
  };

  try {
    console.log("Calling Textract to analyze document...");
    let name, dob, nid;

    const textractData = await textract.analyzeDocument(params).promise();
    const jsonData = textractData.Blocks;

    const lineBlocks = jsonData.filter((block) => block.BlockType === "LINE");

    if (lineBlocks.length > 0) {
      const lastLineBlock = lineBlocks[lineBlocks.length - 1];
      nid = lastLineBlock.Text;

      if (lineBlocks.length >= 3) {
        const blockBeforeLastTwo = lineBlocks[lineBlocks.length - 4];
        const dobText = blockBeforeLastTwo.Text;
        const dobParts = dobText.split(" ");

        if (dobParts.length >= 3) {
          dob = `${dobParts[dobParts.length - 3]} ${
            dobParts[dobParts.length - 2]
          } ${dobParts[dobParts.length - 1]}`;
        } else {
          console.log("Date format is not as expected.");
          dob = dobText;
        }

        console.log("Extracted Date of Birth: " + JSON.stringify(dob));
      } else {
        console.log(
          "Not enough blocks to find a block two positions before the last one."
        );
      }

      const nameBlockIndex = lineBlocks.findIndex(
        (block) => block.Text === "Name"
      );

      if (nameBlockIndex !== -1 && nameBlockIndex < lineBlocks.length - 1) {
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

    response = {
      statusCode: 200,
      body: JSON.stringify({
        name,
        dob,
        nid,
      }),
    };
  } catch (error) {
    console.error("Error occurred while analyzing document:", error);
    response = {
      statusCode: 500,
      body: JSON.stringify("An error occurred while analyzing the document."),
    };
  }

  return response;
};
