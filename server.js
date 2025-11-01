import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors"; 

const app = express();
app.use(cors()); // ✅ enable this before routes
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

// === Simplified /env route (clean output) ===
app.get("/env", (req, res) => {
  const envInfo = {
    status: "✅ Backend is live",
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 8080,
    APP_NAME: process.env.APP_NAME || "SmartClass",
    GEMINI_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
    DEPLOY_URL: process.env.RENDER_EXTERNAL_URL || "unknown",
  };

  res.json(envInfo);
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
