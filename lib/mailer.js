const nodemailer = require("nodemailer");

function getSmtpConfig() {
  const pass = String(process.env.SMTP_PASS || "").replace(/\s/g, "");
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure =
    process.env.SMTP_SECURE === "true" || String(port) === "465";

  return {
    host: String(process.env.SMTP_HOST || "").trim(),
    port,
    secure,
    user: String(process.env.SMTP_USER || "").trim(),
    pass,
    fromEmail: String(process.env.FROM_EMAIL || process.env.SMTP_USER || "").trim(),
    fromName: String(process.env.FROM_NAME || "").trim() || "Email posiljalac",
  };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePayload(body) {
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (!EMAIL_RE.test(to)) {
    return { error: "Neispravna adresa primaoca." };
  }
  if (subject.length < 2 || subject.length > 200) {
    return { error: "Naslov mora imati 2–200 karaktera." };
  }
  if (message.length < 10 || message.length > 10000) {
    return { error: "Poruka mora imati 10–10000 karaktera." };
  }

  return { to, subject, message };
}

async function sendEmail({ to, subject, message }) {
  const cfg = getSmtpConfig();

  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error(
      "SMTP nije podešen. Postavi SMTP_HOST, SMTP_USER i SMTP_PASS (.env ili Netlify env)."
    );
  }
  if (!EMAIL_RE.test(cfg.fromEmail)) {
    throw new Error("FROM_EMAIL / SMTP_USER nije ispravan email.");
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });

  const html =
    '<div style="font-family: system-ui, sans-serif; line-height: 1.6;">' +
    '<p style="white-space: pre-wrap;">' +
    escapeHtml(message) +
    "</p></div>";

  const from =
    cfg.fromName && cfg.fromName.trim() !== ""
      ? `"${cfg.fromName.replace(/"/g, "")}" <${cfg.fromEmail}>`
      : cfg.fromEmail;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: message,
    html,
  });

  return info;
}

module.exports = { sendEmail, validatePayload, getSmtpConfig };
