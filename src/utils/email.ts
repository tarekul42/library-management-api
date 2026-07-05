import nodemailer from "nodemailer";
import { getEnv, getLogger } from "../config/index.js";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const env = getEnv();
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    getLogger().warn("SMTP not configured — skipping email send");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}
