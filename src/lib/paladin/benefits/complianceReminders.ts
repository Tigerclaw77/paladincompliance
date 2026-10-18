import { computeCalendar, isReminderDue, CALENDAR_REMINDER_LEAD_DAYS } from "../calendar/events.ts";
import { renderEmail } from "../email/templates.ts";
import {
  createSendBudget,
  sendWithBudget,
  type Mailer,
  type SendBudget,
} from "./types.ts";

export type CalendarOrganization = {
  organizationId: string;
  organizationName: string;
  periodStart: Date;
  periodEnd: Date;
  cancelAtPeriodEnd: boolean;
  recipients: string[];
};

export type ComplianceReminderDeps = {
  /** Organizations with an active/trialing subscription and a known period. */
  listCalendarOrganizations(): Promise<CalendarOrganization[]>;
  listOptedOutEmails(emails: string[]): Promise<Set<string>>;
  hasReminder(input: {
    organizationId: string;
    eventKey: string;
    dueDate: string;
    email: string;
  }): Promise<boolean>;
  recordReminder(input: {
    organizationId: string;
    eventKey: string;
    dueDate: string;
    email: string;
  }): Promise<void>;
  unsubscribeUrlFor(email: string): string;
  sendMail: Mailer;
  emailConfigured: boolean;
  siteUrl: string;
  contactEmail: string;
};

export type ComplianceReminderResult = {
  dryRun: boolean;
  emailConfigured: boolean;
  organizations: number;
  eventsDue: number;
  alreadySent: number;
  optedOut: number;
  sent: number;
  failed: number;
  capped: number;
  wouldSend: number;
};

export function buildComplianceReminderEmail({
  contactEmail,
  dueDate,
  event,
  organizationName,
  siteUrl,
  unsubscribeUrl,
}: {
  contactEmail: string;
  dueDate: string;
  event: { title: string; description: string; path: string };
  organizationName: string;
  siteUrl: string;
  unsubscribeUrl: string;
}) {
  const rendered = renderEmail({
    contactEmail,
    cta: { label: "Open in your workspace", url: `${siteUrl}${event.path}` },
    heading: `${event.title} due ${dueDate}`,
    kind: "reminder",
    paragraphs: [
      `This is an internal review date on the Paladin compliance calendar for ${organizationName}.`,
      event.description,
      "These dates are suggestions to keep your records current. They are not legal deadlines.",
    ],
    reason:
      "You are receiving this because you are an owner or admin of an active Paladin Compliance membership.",
    unsubscribeUrl,
  });

  return {
    headers: rendered.headers,
    html: rendered.html,
    subject: `Reminder: ${event.title} (${dueDate})`,
    text: rendered.text,
  };
}

/**
 * Sends one reminder per (organization, event, due date, recipient) from
 * CALENDAR_REMINDER_LEAD_DAYS before the due date until the due date.
 * Idempotent through the dedup record, which is written only after a
 * successful send. Respects opt-outs and the per-run volume cap. The renewal
 * event is excluded: the billing renewal notice is a separate job.
 */
export async function runComplianceReminders(
  deps: ComplianceReminderDeps,
  {
    now = new Date(),
    dryRun = false,
    budget = createSendBudget(undefined),
  }: { now?: Date; dryRun?: boolean; budget?: SendBudget } = {}
): Promise<ComplianceReminderResult> {
  const result: ComplianceReminderResult = {
    alreadySent: 0,
    capped: 0,
    dryRun,
    emailConfigured: deps.emailConfigured,
    eventsDue: 0,
    failed: 0,
    optedOut: 0,
    organizations: 0,
    sent: 0,
    wouldSend: 0,
  };

  if (!deps.emailConfigured && !dryRun) {
    return result;
  }

  const organizations = await deps.listCalendarOrganizations();
  const allEmails = organizations.flatMap((org) =>
    org.recipients.map((email) => email.trim().toLowerCase())
  );
  const optedOut = await deps.listOptedOutEmails([...new Set(allEmails)]);

  for (const org of organizations) {
    result.organizations += 1;

    if (org.cancelAtPeriodEnd) {
      continue;
    }

    const events = computeCalendar({
      from: now,
      periodEnd: org.periodEnd,
      periodStart: org.periodStart,
    }).filter(
      (event) =>
        event.key !== "renewal" &&
        isReminderDue(event.dueDate, now, CALENDAR_REMINDER_LEAD_DAYS)
    );
    const emails = [
      ...new Set(
        org.recipients.map((email) => email.trim().toLowerCase()).filter(Boolean)
      ),
    ];

    for (const event of events) {
      result.eventsDue += 1;

      for (const email of emails) {
        if (optedOut.has(email)) {
          result.optedOut += 1;
          continue;
        }

        const key = {
          dueDate: event.dueDate,
          email,
          eventKey: event.key,
          organizationId: org.organizationId,
        };

        if (await deps.hasReminder(key)) {
          result.alreadySent += 1;
          continue;
        }

        if (dryRun) {
          result.wouldSend += 1;
          continue;
        }

        const message = buildComplianceReminderEmail({
          contactEmail: deps.contactEmail,
          dueDate: event.dueDate,
          event,
          organizationName: org.organizationName,
          siteUrl: deps.siteUrl,
          unsubscribeUrl: deps.unsubscribeUrlFor(email),
        });
        const outcome = await sendWithBudget(budget, deps.sendMail, {
          to: email,
          ...message,
        });

        if (outcome === "sent") {
          try {
            await deps.recordReminder(key);
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
    }
  }

  return result;
}
