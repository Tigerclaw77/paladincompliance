// Sends ONE test email through the configured SMTP settings, using the same
// template, disclaimer footer, and List-Unsubscribe headers as the real
// reminder emails. It does nothing unless you pass --yes-send.
//
//   EMAIL_SERVER=... EMAIL_FROM=... node scripts/send-test-email.mjs --to you@example.com
//       (dry run: prints what would be sent, never prints credentials)
//   EMAIL_SERVER=... EMAIL_FROM=... node scripts/send-test-email.mjs --to you@example.com --yes-send
//       (sends exactly one message to that one address)
//
// Requires Node 22. Run it from a shell where the env vars are set; do not
// paste credentials into chat, tickets, or commits.
import nodemailer from "nodemailer";
import { renderEmail } from "../src/lib/paladin/email/templates.ts";
import { buildUnsubscribeUrl } from "../src/lib/paladin/email/unsubscribe.ts";

const args = process.argv.slice(2);
const toIndex = args.indexOf("--to");
const to = toIndex >= 0 ? args[toIndex + 1] : "";
const send = args.includes("--yes-send");

if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error("Usage: node scripts/send-test-email.mjs --to you@example.com [--yes-send]");
  process.exit(2);
}

const server = process.env.EMAIL_SERVER ?? "";
const from = process.env.EMAIL_FROM ?? "";
const replyTo = process.env.EMAIL_REPLY_TO || "contact@paladincompliance.com";
const siteUrl = process.env.NEXTAUTH_URL || "https://www.paladincompliance.com";

if (!server || !from || /localhost|127\.0\.0\.1/.test(server)) {
  console.error("EMAIL_SERVER and EMAIL_FROM must be set to a real provider (not localhost).");
  process.exit(2);
}

let host = "unparseable";

try {
  const url = new URL(server);
  host = `${url.protocol}//${url.hostname}:${url.port || "(default)"}`;
} catch {}

const unsubscribeUrl = buildUnsubscribeUrl({
  email: to,
  secret: process.env.AUTH_SECRET || "test-only-secret-not-for-production",
  siteUrl,
});
const mail = renderEmail({
  contactEmail: replyTo,
  cta: { label: "Open the compliance calendar", url: `${siteUrl}/dashboard/calendar` },
  heading: "Test: compliance calendar reminder",
  kind: "reminder",
  paragraphs: [
    "This is a test of Paladin Compliance reminder emails. No action is needed.",
    "Real reminders name an upcoming review date from your membership calendar.",
  ],
  reason: "You are receiving this test because the Paladin Compliance owner requested it.",
  unsubscribeUrl,
});

console.log(`Transport: ${host}`);
console.log(`From: ${from}`);
console.log(`To: ${to}`);
console.log(`Subject: [Test] Paladin Compliance reminder email`);
console.log(`Mode: ${send ? "SENDING ONE MESSAGE" : "dry run (add --yes-send to send)"}`);

if (!send) {
  process.exit(0);
}

const transport = nodemailer.createTransport(server, {
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

try {
  const info = await transport.sendMail({
    from,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    html: mail.html,
    replyTo,
    subject: "[Test] Paladin Compliance reminder email",
    text: mail.text,
    to,
  });
  console.log(`Accepted by SMTP server. Message id: ${info.messageId}`);
} catch (error) {
  console.error(`Send failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exit(1);
}
