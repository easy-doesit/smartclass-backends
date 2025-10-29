// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create model instance (Gemini 2.0)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- ROUTES ---

// Root (for testing)
app.get("/", (req, res) => {
  res.json({ status: "SmartClass Assistant API running ✅" });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message text" });
    }

    const prompt = `
You are SmartClass Assistant, a scholarly AI that helps Nigerian undergraduates 
write high-quality term papers, seminar papers, theses, and industrial reports. 
Follow these writing guidelines:

- Structure chapters clearly (Introduction, Literature Review, etc.)
- Use academic tone: formal, factual, concise.
- Provide examples, subtopics, and suggested sources.
- When useful, cite the user's website database:
  - https://cbtportalng.blogspot.com
  - https://cbtportalng.blogspot.com/p/term-papers.html
  - https://cbtportalng.blogspot.com/p/project-database.html
  - https://cbtportalng.blogspot.com/p/project-repository.html
- Avoid fluff or casual expressions.
- Always guide and explain your structure (not just write the content blindly).

Now, respond to this query:
${message}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ SmartClass Assistant listening on port ${PORT}`));
