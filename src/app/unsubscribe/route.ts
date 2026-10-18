import { NextRequest, NextResponse } from "next/server";
import {
  normalizeEmail,
  verifyUnsubscribeToken,
} from "@/lib/paladin/email/unsubscribe";
import { escapeHtml } from "@/lib/paladin/email/templates";
import { getSupportEmail } from "@/lib/paladin/env";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-click opt-out from reminder and update emails (RFC 8058 compatible: the
// List-Unsubscribe header points here and mail clients POST to it). GET only
// shows a confirmation form so link scanners and prefetchers cannot opt a
// person out by merely fetching the URL. Billing notices are unaffected.

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Paladin Compliance</title></head><body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;color:#0f172a;margin:0;padding:32px"><main style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;padding:24px"><p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;font-weight:bold;color:#1e3a8a">PALADIN COMPLIANCE</p><h1 style="font-size:20px">${escapeHtml(title)}</h1>${body}</main></body></html>`;

  return new NextResponse(html, {
    headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" },
    status,
  });
}

function readParams(request: NextRequest, form?: FormData) {
  const email = String(request.nextUrl.searchParams.get("e") ?? form?.get("e") ?? "");
  const token = String(request.nextUrl.searchParams.get("t") ?? form?.get("t") ?? "");

  return { email: normalizeEmail(email), token };
}

function isValid(email: string, token: string) {
  return (
    email.length > 3 &&
    email.length <= 254 &&
    verifyUnsubscribeToken(email, token, process.env.AUTH_SECRET ?? "")
  );
}

export async function GET(request: NextRequest) {
  const { email, token } = readParams(request);

  if (!isValid(email, token)) {
    return page(
      "Link not valid",
      `<p>This opt-out link is not valid. Email <a href="mailto:${escapeHtml(getSupportEmail())}">${escapeHtml(getSupportEmail())}</a> and we will remove you manually.</p>`,
      400
    );
  }

  return page(
    "Stop reminder emails?",
    `<p>Stop Paladin Compliance reminder and update emails to <strong>${escapeHtml(email)}</strong>? Billing and sign-in emails are not affected.</p><form method="post"><input type="hidden" name="e" value="${escapeHtml(email)}"><input type="hidden" name="t" value="${escapeHtml(token)}"><button type="submit" style="background:#1e3a8a;color:#fff;border:0;border-radius:6px;padding:10px 16px;font-weight:bold;cursor:pointer">Yes, stop these emails</button></form>`
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => undefined);
  const { email, token } = readParams(request, form);

  if (!isValid(email, token)) {
    return page("Link not valid", "<p>This opt-out link is not valid.</p>", 400);
  }

  await prisma.emailOptOut.upsert({
    create: { email, scope: "reminders" },
    update: {},
    where: { email },
  });

  logOperationalEvent("info", "email_opt_out_recorded", { scope: "reminders" });

  return page(
    "You are unsubscribed",
    `<p>Reminder and update emails to <strong>${escapeHtml(email)}</strong> are turned off. You will still receive sign-in links and billing notices. To turn reminders back on, email <a href="mailto:${escapeHtml(getSupportEmail())}">${escapeHtml(getSupportEmail())}</a>.</p>`
  );
}
