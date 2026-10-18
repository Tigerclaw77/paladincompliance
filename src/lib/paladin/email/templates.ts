// Pure email rendering (no server-only/database imports) so it can be unit
// tested with `node --test`. Every message is plain and branded "Paladin
// Compliance", carries the documentation-only disclaimer, and the reminder
// kind carries a one-click opt-out link.

export const EMAIL_DISCLAIMER =
  "Paladin Compliance provides documentation and records only. This message is not legal advice, a certification, an audit, or a guarantee of compliance.";

export type EmailKind = "transactional" | "reminder";

export type RenderEmailInput = {
  /** Short heading line, shown at the top of the message. */
  heading: string;
  /** Body paragraphs. Plain text; HTML is escaped. */
  paragraphs: string[];
  /** Optional bullet lines rendered after the paragraphs. */
  bullets?: string[];
  /** Optional call-to-action link. */
  cta?: { label: string; url: string };
  /** Why the recipient got this message (one sentence). */
  reason: string;
  kind: EmailKind;
  /** Required for kind "reminder": absolute one-click opt-out URL. */
  unsubscribeUrl?: string;
  contactEmail: string;
};

export type RenderedEmail = {
  text: string;
  html: string;
  headers: Record<string, string>;
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips CR/LF so a value can never inject extra header or subject lines. */
export function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function renderEmail(input: RenderEmailInput): RenderedEmail {
  if (input.kind === "reminder" && !input.unsubscribeUrl) {
    throw new Error("Reminder emails require an unsubscribe URL.");
  }

  const heading = singleLine(input.heading);
  const textLines: string[] = ["PALADIN COMPLIANCE", "", heading, ""];

  for (const paragraph of input.paragraphs) {
    textLines.push(paragraph, "");
  }

  if (input.bullets?.length) {
    for (const bullet of input.bullets) {
      textLines.push(`- ${bullet}`);
    }
    textLines.push("");
  }

  if (input.cta) {
    textLines.push(`${input.cta.label}: ${input.cta.url}`, "");
  }

  textLines.push("--", EMAIL_DISCLAIMER, input.reason);
  textLines.push(`Questions: ${input.contactEmail} (email support, best effort on business days; no guaranteed response time).`);

  if (input.kind === "reminder" && input.unsubscribeUrl) {
    textLines.push(`Stop these reminder emails: ${input.unsubscribeUrl}`);
  }

  const htmlParagraphs = input.paragraphs
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const htmlBullets = input.bullets?.length
    ? `<ul style="margin:0 0 14px;padding-left:20px;line-height:1.55">${input.bullets
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("")}</ul>`
    : "";
  const htmlCta = input.cta
    ? `<p style="margin:18px 0"><a href="${escapeHtml(input.cta.url)}" style="background:#1e3a8a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(input.cta.label)}</a></p>`
    : "";
  const htmlUnsub =
    input.kind === "reminder" && input.unsubscribeUrl
      ? `<br><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#475569">Stop these reminder emails</a>`
      : "";
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px"><p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;font-weight:bold;color:#1e3a8a">PALADIN COMPLIANCE</p><h1 style="margin:0 0 18px;font-size:20px">${escapeHtml(heading)}</h1>${htmlParagraphs}${htmlBullets}${htmlCta}<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"><p style="margin:0;font-size:12px;line-height:1.5;color:#475569">${escapeHtml(EMAIL_DISCLAIMER)}<br>${escapeHtml(input.reason)}<br>Questions: ${escapeHtml(input.contactEmail)} (email support, best effort on business days; no guaranteed response time).${htmlUnsub}</p></div></body></html>`;

  const headers: Record<string, string> = {};

  if (input.kind === "reminder" && input.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${input.unsubscribeUrl}>, <mailto:${input.contactEmail}?subject=Unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  return { text: textLines.join("\n"), html, headers };
}
