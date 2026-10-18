import "server-only";

import nodemailer from "nodemailer";
import { getEmailConfig, isEmailProviderConfigured } from "@/lib/paladin/env";
import { EmailNotConfiguredError, type Mailer } from "./types";

/**
 * Sends through the same SMTP settings NextAuth uses for magic-link email
 * (EMAIL_SERVER / EMAIL_FROM / EMAIL_REPLY_TO). Refuses to send when no real
 * provider is configured instead of pretending to deliver. Connection and send
 * timeouts keep a stuck SMTP server from hanging a cron invocation.
 */
export function createSmtpMailer(): Mailer {
  if (!isEmailProviderConfigured()) {
    throw new EmailNotConfiguredError();
  }

  const config = getEmailConfig();
  const transport = nodemailer.createTransport(config.server, {
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return async ({ headers, html, subject, text, to }) => {
    await transport.sendMail({
      from: config.from,
      headers,
      html,
      replyTo: config.replyTo,
      subject,
      text,
      to,
    });
  };
}
