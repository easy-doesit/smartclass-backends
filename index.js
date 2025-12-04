import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" })); // supports files

// =========================
//   CHAT ROUTE (MAIN API)
// =========================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model, attachments } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "⚠️ Missing messages array." });
    }

    const userInput = messages[messages.length - 1].content || "";

    // CONVERT to Gemini format
    const geminiInput = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userInput },

            // If file attachments exist, include them
            ...(attachments || []).map((f) => ({
              inlineData: {
                mimeType: f.type || "application/octet-stream",
                data: f.content, // base64
              }
            })),
          ],
        },
      ],
    };

    // CALL GEMINI
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiInput),
      }
    );

    if (!response.ok) {
      console.error("Gemini error", await response.text());
      return res.status(500).json({ reply: "❌ Gemini returned an error." });
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No reply generated.";

    return res.json({ reply });
  } catch (err) {
    console.error("Backend crash:", err);
    return res.status(500).json({ reply: "❌ Server error occurred." });
  }
});

// ====================================
//   ENV CHECK ROUTE (for debugging)
// ====================================
app.get("/env", (req, res) => {
  res.json({
    GEMINI_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    OK: true,
  });
});

// =========================
//   ROOT ROUTE
// =========================
app.get("/", (req, res) => {
  res.send("SmartClass Backend Running ✔️");
});

// =========================
//   SERVER START
// =========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 SmartClass backend running on port ${PORT}`);
});
