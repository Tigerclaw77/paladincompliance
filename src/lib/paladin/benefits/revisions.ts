import { renderEmail } from "../email/templates.ts";
import {
  createSendBudget,
  sendWithBudget,
  type Mailer,
  type SendBudget,
} from "./types.ts";

export class RevisionConflictError extends Error {
  constructor(version: string) {
    super(
      `Revision ${version} was already released with different content. The revision log is append-only: publish a new version instead.`
    );
    this.name = "RevisionConflictError";
  }
}

export type RevisionInput = {
  version: string;
  title: string;
  summary: string;
  changes?: string;
  releasedBy?: string | null;
};

export type RevisionRecord = {
  id: string;
  version: string;
  title: string;
  summary: string;
  changes: string;
};

export type RevisionRecipient = {
  organizationId: string;
  organizationName: string;
  email: string;
};

export type RevisionDeps = {
  /** Creates the revision, or returns the existing row for the same version. */
  upsertRevision(input: Required<RevisionInput>): Promise<RevisionRecord>;
  /** Owners/admins of organizations with an active or trialing subscription. */
  listActiveSubscriberRecipients(): Promise<RevisionRecipient[]>;
  /** Lower-cased emails already notified about this revision. */
  listNoticedEmails(revisionId: string): Promise<Set<string>>;
  recordNotice(input: {
    revisionId: string;
    organizationId: string;
    email: string;
  }): Promise<void>;
  sendMail: Mailer;
  /** Lower-cased emails that opted out of update/reminder emails. */
  listOptedOutEmails(emails: string[]): Promise<Set<string>>;
  unsubscribeUrlFor(email: string): string;
  emailConfigured: boolean;
  siteUrl: string;
  contactEmail: string;
};

export type RevisionReleaseResult = {
  revisionId: string;
  version: string;
  emailConfigured: boolean;
  recipients: number;
  sent: number;
  alreadyNotified: number;
  optedOut: number;
  failed: number;
  capped: number;
};

const VERSION_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;

export function validateRevisionInput(
  raw: Partial<RevisionInput>
): { ok: true; value: Required<RevisionInput> } | { ok: false; error: string } {
  const version = (raw.version ?? "").trim();
  const title = (raw.title ?? "").trim();
  const summary = (raw.summary ?? "").trim();
  const changes = (raw.changes ?? "").trim();

  if (!VERSION_RE.test(version)) {
    return {
      ok: false,
      error: "Version must be 1-32 characters: letters, numbers, dot, dash, underscore.",
    };
  }
  if (title.length < 3 || title.length > 150) {
    return { ok: false, error: "Title must be 3-150 characters." };
  }
  if (summary.length < 10 || summary.length > 1000) {
    return { ok: false, error: "Summary must be 10-1000 characters." };
  }
  if (changes.length > 5000) {
    return { ok: false, error: "Change list must be 5000 characters or fewer." };
  }

  return {
    ok: true,
    value: {
      version,
      title,
      summary,
      changes,
      releasedBy: raw.releasedBy ?? null,
    },
  };
}

export function buildRevisionEmail({
  contactEmail = "contact@paladincompliance.com",
  organizationName,
  revision,
  siteUrl,
  unsubscribeUrl,
}: {
  contactEmail?: string;
  organizationName: string;
  revision: RevisionRecord;
  siteUrl: string;
  unsubscribeUrl: string;
}) {
  const bullets = revision.changes
    ? revision.changes
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const rendered = renderEmail({
    bullets,
    contactEmail,
    cta: { label: "Open the revision log", url: `${siteUrl}/dashboard/updates` },
    heading: `Binder revision ${revision.version}: ${revision.title}`,
    kind: "reminder",
    paragraphs: [
      `A new revision of the Paladin AI Policy & Evidence Binder is available for ${organizationName}.`,
      revision.summary,
      ...(bullets.length ? ["What changed:"] : []),
    ],
    reason:
      "You are receiving this because your organization has an active Paladin Compliance membership.",
    unsubscribeUrl,
  });

  return {
    headers: rendered.headers,
    html: rendered.html,
    subject: `Paladin binder revision ${revision.version}: ${revision.title}`,
    text: rendered.text,
  };
}

/**
 * Records a binder revision and emails each active subscriber once. Safe to
 * re-run for the same version: recipients already noticed are skipped, and a
 * failed send is not recorded, so a later run retries only the failures.
 * Without a configured email provider the revision is still logged but nothing
 * is sent or recorded as sent.
 */
export async function releaseBinderRevision(
  deps: RevisionDeps,
  input: RevisionInput,
  { budget = createSendBudget(undefined) }: { budget?: SendBudget } = {}
): Promise<RevisionReleaseResult> {
  const parsed = validateRevisionInput(input);

  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  const revision = await deps.upsertRevision(parsed.value);

  // Append-only log: the same version may be re-published to retry failed or
  // capped sends, but never with different content.
  if (
    revision.title !== parsed.value.title ||
    revision.summary !== parsed.value.summary ||
    revision.changes !== parsed.value.changes
  ) {
    throw new RevisionConflictError(parsed.value.version);
  }

  const result: RevisionReleaseResult = {
    revisionId: revision.id,
    version: revision.version,
    emailConfigured: deps.emailConfigured,
    recipients: 0,
    sent: 0,
    alreadyNotified: 0,
    optedOut: 0,
    failed: 0,
    capped: 0,
  };

  if (!deps.emailConfigured) {
    return result;
  }

  const [recipients, noticed] = await Promise.all([
    deps.listActiveSubscriberRecipients(),
    deps.listNoticedEmails(revision.id),
  ]);
  const optedOut = await deps.listOptedOutEmails(
    recipients.map((recipient) => recipient.email.trim().toLowerCase())
  );
  const seen = new Set<string>();

  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase();

    if (!email || seen.has(email)) {
      continue;
    }

    seen.add(email);
    result.recipients += 1;

    if (noticed.has(email)) {
      result.alreadyNotified += 1;
      continue;
    }

    if (optedOut.has(email)) {
      result.optedOut += 1;
      continue;
    }

    const message = buildRevisionEmail({
      contactEmail: deps.contactEmail,
      organizationName: recipient.organizationName,
      revision,
      siteUrl: deps.siteUrl,
      unsubscribeUrl: deps.unsubscribeUrlFor(email),
    });
    const outcome = await sendWithBudget(budget, deps.sendMail, {
      to: email,
      ...message,
    });

    if (outcome === "sent") {
      try {
        await deps.recordNotice({
          revisionId: revision.id,
          organizationId: recipient.organizationId,
          email,
        });
        result.sent += 1;
      } catch {
        result.failed += 1;
      }
    } else if (outcome === "capped") {
      result.capped += 1;
    } else {
      result.failed += 1;
    }
  }

  return result;
}
