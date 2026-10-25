import "server-only";
import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; html: string; text: string };

// Seznam vyžaduje, aby odesílatel (From) byl stejný jako přihlášený účet
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.seznam.cz",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * Odešle e-mail. Bez SMTP údajů (lokální vývoj) e-mail jen vypíše do konzole.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[mail] (bez SMTP) Komu: ${mail.to} | ${mail.subject}\n${mail.text}`);
    return;
  }

  await createTransport().sendMail({
    from: `Pizzerie Alberto <${process.env.SMTP_USER}>`,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
