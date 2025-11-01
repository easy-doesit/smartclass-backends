import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === Chat Endpoint ===
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: "⚠️ No message provided." });

  const start = Date.now();

  async function fetchGemini() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

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
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      return await response.json();
    } catch (err) {
      clearTimeout(timeout);
      console.error("Gemini request error:", err.message);
      return null;
    }
  }

  let data = await fetchGemini();
  if (!data) {
    console.log("Retrying once...");
    data = await fetchGemini();
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "🤖 SmartClass is currently busy. Please try again shortly.";

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`🧠 Gemini responded in ${elapsed}s`);

  res.json({ reply });
});

// === /env Route ===
app.get("/env", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: hasKey ? "✅ API key detected" : "❌ No API key found",
    GEMINI_KEY_EXISTS: hasKey,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    APP_NAME: "SmartClass",
    DEPLOY_URL: process.env.RENDER_EXTERNAL_URL || "local",
  });
});

// === Root Route ===
app.get("/", (req, res) => {
  res.send("✅ SmartClass backend running with Gemini 2.5 Flash (stable).");
});

// === Start Server ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ SmartClass backend running on port ${PORT}`));
