require("dotenv").config();

const path = require("path");
const express = require("express");
const { sendEmail, validatePayload } = require("./lib/mailer");

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname)));

app.post("/api/send-email", async (req, res) => {
  const validated = validatePayload(req.body || {});
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  try {
    const info = await sendEmail(validated);
    return res.json({
      ok: true,
      message:
        "Poruka je poslata. Proveri inbox i Spam za: " + validated.to,
      to: validated.to,
      messageId: info.messageId,
    });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Slanje nije uspelo.",
    });
  }
});

app.listen(PORT, () => {
  console.log("Email sender: http://localhost:" + PORT);
  console.log("API: POST http://localhost:" + PORT + "/api/send-email");
});
