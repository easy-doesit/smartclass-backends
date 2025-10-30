import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config(); // load environment variables

const app = express();
app.use(bodyParser.json());

// === Chat endpoint ===
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t generate a response right now.";

    res.json({ reply });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// === Safe dynamic /env route ===
app.get("/env", (req, res) => {
  // List of sensitive keywords to never expose
  const sensitiveKeywords = ["KEY", "SECRET", "PASSWORD", "TOKEN", "API"];

  const safeEnv = {};
  Object.keys(process.env).forEach((key) => {
    const isSensitive = sensitiveKeywords.some((word) =>
      key.toUpperCase().includes(word)
    );
    if (!isSensitive) safeEnv[key] = process.env[key];
  });

  res.json({
    ...safeEnv,
    GEMINI_KEY_EXISTS: !!process.env.GEMINI_API_KEY, // safe boolean for testing
  });
});

// === Default route ===
app.get("/", (req, res) => {
  res.send("✅ SmartClass backend is running with Gemini 2.5 Flash.");
});

// === Start server ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ SmartClass backend running on port ${PORT}`)
);
