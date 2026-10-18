import type { Mailer } from "./types";

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
  emailConfigured: boolean;
  siteUrl: string;
};

export type RevisionReleaseResult = {
  revisionId: string;
  version: string;
  emailConfigured: boolean;
  recipients: number;
  sent: number;
  alreadyNotified: number;
  failed: number;
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
  organizationName,
  revision,
  siteUrl,
}: {
  organizationName: string;
  revision: RevisionRecord;
  siteUrl: string;
}) {
  const lines = [
    `A new revision of the Paladin AI Policy & Evidence Binder is available for ${organizationName}.`,
    "",
    `Revision ${revision.version}: ${revision.title}`,
    "",
    revision.summary,
  ];

  if (revision.changes) {
    lines.push("", "What changed:", revision.changes);
  }

  lines.push(
    "",
    `Revision log: ${siteUrl}/dashboard/updates`,
    `Download the current quick-reference record: ${siteUrl}/dashboard/assets`,
    "",
    "This revision is documentation only. It is not legal advice, a certification, or a guarantee of compliance.",
    "You are receiving this because your organization has an active Paladin Compliance subscription."
  );

  return {
    subject: `Paladin binder revision ${revision.version}: ${revision.title}`,
    text: lines.join("\n"),
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
  input: RevisionInput
): Promise<RevisionReleaseResult> {
  const parsed = validateRevisionInput(input);

  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  const revision = await deps.upsertRevision(parsed.value);
  const result: RevisionReleaseResult = {
    revisionId: revision.id,
    version: revision.version,
    emailConfigured: deps.emailConfigured,
    recipients: 0,
    sent: 0,
    alreadyNotified: 0,
    failed: 0,
  };

  if (!deps.emailConfigured) {
    return result;
  }

  const [recipients, noticed] = await Promise.all([
    deps.listActiveSubscriberRecipients(),
    deps.listNoticedEmails(revision.id),
  ]);
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

    const message = buildRevisionEmail({
      organizationName: recipient.organizationName,
      revision,
      siteUrl: deps.siteUrl,
    });

    try {
      await deps.sendMail({ to: email, ...message });
      await deps.recordNotice({
        revisionId: revision.id,
        organizationId: recipient.organizationId,
        email,
      });
      result.sent += 1;
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
