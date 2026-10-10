const { sendEmail, validatePayload } = require("../../lib/mailer");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Dozvoljen je samo POST." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Neispravan JSON." });
  }

  const validated = validatePayload(body);
  if (validated.error) {
    return json(400, { error: validated.error });
  }

  try {
    const info = await sendEmail(validated);
    return json(200, {
      ok: true,
      message:
        "Poruka je poslata. Proveri inbox i Spam za: " + validated.to,
      to: validated.to,
      messageId: info.messageId,
    });
  } catch (err) {
    return json(502, {
      error: err.message || "Slanje nije uspelo.",
    });
  }
};
