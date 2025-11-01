import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// === Chat endpoint ===
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

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

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Sorry, I couldn’t generate a response right now.";

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`🧠 Gemini replied in ${elapsed}s`);

    res.json({ reply, elapsed });
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      console.error("⏱️ Request timed out after 20s.");
      return res
        .status(504)
        .json({ error: "Gemini API timeout after 20s", elapsed: "20+" });
    }

    console.error("❌ Chat endpoint error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// === /env route — safe debug info ===
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

// === Root route ===
app.get("/", (req, res) => {
  res.send("✅ SmartClass backend is running with Gemini 2.5 Flash (optimized).");
});

// === Start server ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ SmartClass backend running on port ${PORT}`)
);
