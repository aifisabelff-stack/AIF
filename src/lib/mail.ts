import nodemailer from "nodemailer";

export type SendMailResult = { ok: true } | { ok: false; error: string };

function createTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendMailResult> {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      ok: false,
      error:
        "El envío de correo no está configurado. Añada SMTP_HOST, SMTP_USER y SMTP_PASS en el servidor.",
    };
  }

  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "noreply@iaf-aesthetic.local";

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al enviar el correo";
    return { ok: false, error: msg };
  }
}
