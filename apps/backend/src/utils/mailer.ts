import nodemailer, { type Transporter } from "nodemailer";
import { env, smtpEnabled } from "../config/env";
import { logger } from "./logger";

let transporter: Transporter | null = null;

if (smtpEnabled) {
  const port = env.SMTP_PORT ?? 465;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

interface MailInput {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async ({ to, subject, html }: MailInput): Promise<void> => {
  if (!transporter) {
    logger.info(`Email transport disabled; skipping "${subject}" to ${to}`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html });
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error("Failed to send email", error);
  }
};

export const buildWelcomeEmail = (
  firstName: string,
): { subject: string; html: string } => ({
  subject: "Welcome to DevCollab",
  html: `
    <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#f5f6f8;">
      <div style="max-width:560px;margin:auto;background:#ffffff;padding:28px;border-radius:14px;border:1px solid #e6e8ec;">
        <h2 style="color:#4f46e5;margin-top:0;">DevCollab</h2>
        <p style="color:#111827;">Hello ${firstName},</p>
        <p style="color:#374151;">Your account is ready. You can now discover developers, send connection requests, chat, and pair-program in real time.</p>
        <p style="color:#6b7280;font-size:13px;">If you did not create this account, you can safely ignore this message.</p>
      </div>
    </div>
  `,
});
