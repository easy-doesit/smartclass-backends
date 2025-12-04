import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// --- CORS FIX (WORDPRESS + CODEPEN + RENDER ACCEPTED) ---
app.use(
  cors({
    origin: [
      "https://codepen.io",
      "https://cdpn.io",
      /\.wordpress\.com$/,
      /\.wp\.com$/,
      process.env.RENDER_EXTERNAL_URL
    ],
    credentials: true
  })
);

app.use(bodyParser.json({ limit: "20mb" })); // support base64 files

// === Chat Endpoint ===
app.post("/api/chat", async (req, res) => {
  const { message, model, file } = req.body;

  if (!message && !file)
    return res.status(400).json({ reply: "⚠️ No input received." });

  const start = Date.now();

  // Convert base64 file to Gemini inlineData format if present
  let filePart = null;

  if (file?.data) {
    filePart = {
      inlineData: {
        mimeType: file.type,
        data: file.data.split(",")[1] // remove "data:...;base64,"
      }
    };
  }

  async function fetchGemini() {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.5-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  ...(filePart ? [filePart] : []),
                  ...(message ? [{ text: message }] : [])
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();

      return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        null
      );
    } catch (err) {
      console.error("Gemini error:", err);
      return null;
    }
  }

  let reply = await fetchGemini();
  if (!reply) reply = "⚠️ SmartClass is busy. Try again.";

  res.json({ reply });
});

// === /env Route (kept the same) ===
app.get("/env", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: hasKey ? "✅ API key detected" : "❌ No API key found",
    GEMINI_KEY_EXISTS: hasKey,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    APP_NAME: "SmartClass",
    DEPLOY_URL: process.env.RENDER_EXTERNAL_URL || "local"
  });
});

// === Root Route ===
app.get("/", (req, res) => {
  res.send("✅ SmartClass backend running with Gemini 2.5 Flash.");
});

// === Start Server ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 SmartClass backend running on port ${PORT}`)
);
