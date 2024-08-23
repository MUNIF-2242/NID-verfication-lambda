const AWS = require("aws-sdk");
const textract = new AWS.Textract();

exports.handler = async (event) => {
  console.log("Lambda function /detect-text was invoked.");

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

    // Find the index of the block that includes the text "Name" and "NID No"
    let nameBlockIndex = -1;
    let nidBlockIndex = -1;

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
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: success ? "success" : "fail",
        nidData: {
          dob,
          name,
          nid,
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
