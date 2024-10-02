// server.js
const express = require("express");
const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to extract name from the description
const extractName = (description) => {
  // This regex assumes names start with uppercase letters and can contain spaces or dots
  const nameMatch = description.match(/"([^"]+)"/);
  return nameMatch ? nameMatch[1] : null; // Returns the name if matched, otherwise null
};

// Endpoint to get image description
app.post("/identify-name", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
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
      res.json({ name });
    } else {
      res.json({ error: "No name found in the image description." });
    }
  } catch (error) {
    console.error("Error fetching image description:", error);
    res.status(500).json({ error: "Failed to get image description" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
