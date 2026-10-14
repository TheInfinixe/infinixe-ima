// Envío de correos por Gmail SMTP (misma cuenta que el correo de resultados).
import nodemailer from "nodemailer";

export async function sendMail({ to, subject, html, replyTo }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD no configuradas");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transporter.sendMail({ from: `"Infinixe" <${user}>`, to, subject, html, replyTo });
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://infinixe-ima.vercel.app").replace(/\/$/, "");
