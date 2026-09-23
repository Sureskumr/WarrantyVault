import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;

function getTransporter() {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    // No SMTP configured — behave like a dev/mock provider rather than throwing,
    // so the rest of the notification flow (in-app record, etc.) still works.
    logger.info(`[MOCK EMAIL] -> ${to}: ${subject}`);
    return { success: true, mocked: true };
  }
  await t.sendMail({ from: env.SMTP_FROM, to, subject, html });
  return { success: true };
}
