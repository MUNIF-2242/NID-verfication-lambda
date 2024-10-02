const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to extract name from the description
const extractName = (description) => {
  const nameMatch = description.match(/"([^"]+)"/);
  return nameMatch ? nameMatch[1] : null;
};

// Lambda handler function
exports.handler = async (event) => {
  try {
    // Parse the incoming request body
    const body = JSON.parse(event.body);
    const { imageUrl } = body;

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Image URL is required" }),
      };
    }

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Is there any person name in this image?" },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
          temperature: 0,
        },
      ],
    });

    const description =
      response.choices[0]?.message.content || "No description available";
    const name = extractName(description);

    if (name) {
      return {
        statusCode: 200,
        body: JSON.stringify({ name }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          error: "No name found in the image description.",
        }),
      };
    }
  } catch (error) {
    console.error("Error fetching image description:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to get image description" }),
    };
  }
};
