import "server-only";

import nodemailer from "nodemailer";
import { getEmailConfig, isEmailProviderConfigured } from "@/lib/paladin/env";
import { EmailNotConfiguredError, type Mailer } from "./types";

/**
 * Sends through the same SMTP settings NextAuth uses for magic-link email
 * (EMAIL_SERVER / EMAIL_FROM / EMAIL_REPLY_TO). Refuses to send when no real
 * provider is configured instead of pretending to deliver.
 */
export function createSmtpMailer(): Mailer {
  if (!isEmailProviderConfigured()) {
    throw new EmailNotConfiguredError();
  }

  const config = getEmailConfig();
  const transport = nodemailer.createTransport(config.server);

  return async ({ to, subject, text }) => {
    await transport.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      subject,
      text,
      to,
    });
  };
}
