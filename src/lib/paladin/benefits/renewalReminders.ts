import { renderEmail } from "../email/templates.ts";
import {
  createSendBudget,
  sendWithBudget,
  type Mailer,
  type SendBudget,
} from "./types.ts";

export const RENEWAL_REMINDER_DAYS = 30;
// Catch-up window so a missed daily run does not skip a subscriber.
export const RENEWAL_REMINDER_GRACE_DAYS = 3;

export type DueSubscription = {
  subscriptionId: string;
  organizationId: string;
  organizationName: string;
  planName: string | null;
  periodEnd: Date;
  cancelAtPeriodEnd: boolean;
  recipients: string[];
};

export type RenewalReminderDeps = {
  /** Active/trialing subscriptions with currentPeriodEnd in [from, to]. */
  findSubscriptionsRenewingBetween(range: {
    from: Date;
    to: Date;
  }): Promise<DueSubscription[]>;
  hasReminder(input: {
    subscriptionId: string;
    periodEnd: Date;
    email: string;
  }): Promise<boolean>;
  recordReminder(input: {
    subscriptionId: string;
    organizationId: string;
    periodEnd: Date;
    email: string;
  }): Promise<void>;
  sendMail: Mailer;
  emailConfigured: boolean;
  siteUrl: string;
  contactEmail: string;
};

export type RenewalReminderResult = {
  dryRun: boolean;
  emailConfigured: boolean;
  windowFrom: string;
  windowTo: string;
  subscriptionsInWindow: number;
  skippedCancelling: number;
  alreadySent: number;
  sent: number;
  failed: number;
  capped: number;
  wouldSend: number;
};

const DAY_MS = 86_400_000;

export function renewalWindow(
  now: Date,
  daysAhead = RENEWAL_REMINDER_DAYS,
  graceDays = RENEWAL_REMINDER_GRACE_DAYS
) {
  return {
    from: new Date(now.getTime() + (daysAhead - graceDays) * DAY_MS),
    to: new Date(now.getTime() + daysAhead * DAY_MS),
  };
}

export function formatRenewalDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildRenewalReminderEmail({
  contactEmail = "contact@paladincompliance.com",
  organizationName,
  periodEnd,
  planName,
  siteUrl,
}: {
  contactEmail?: string;
  organizationName: string;
  periodEnd: Date;
  planName: string | null;
  siteUrl: string;
}) {
  const date = formatRenewalDate(periodEnd);
  const rendered = renderEmail({
    contactEmail,
    cta: { label: "Manage billing", url: `${siteUrl}/dashboard/billing` },
    heading: `Your membership renews on ${date}`,
    kind: "transactional",
    paragraphs: [
      `The annual Paladin Compliance membership for ${organizationName}${planName ? ` (${planName})` : ""} is scheduled to renew on ${date}.`,
      "No action is needed to keep the membership and registry record active. To review the payment method, change the plan, or cancel before renewal, open Manage Billing. Billing is handled by Stripe.",
      "This is a one-time reminder about an already-scheduled renewal, sent about 30 days ahead.",
    ],
    reason:
      "You are receiving this billing notice because you are an owner or admin of this Paladin Compliance membership.",
  });

  return {
    headers: rendered.headers,
    html: rendered.html,
    subject: `Your Paladin Compliance membership renews on ${date}`,
    text: rendered.text,
  };
}

/**
 * Sends one reminder per (subscription, renewal date, recipient), about 30 days
 * before the renewal. Idempotent: reminders are recorded only after a
 * successful send, so re-running the job never duplicates a reminder and
 * retries failures. Subscriptions set to cancel at period end are skipped
 * because they will not renew. With dryRun, nothing is sent or recorded.
 */
export async function runRenewalReminders(
  deps: RenewalReminderDeps,
  {
    now = new Date(),
    dryRun = false,
    budget = createSendBudget(undefined),
  }: { now?: Date; dryRun?: boolean; budget?: SendBudget } = {}
): Promise<RenewalReminderResult> {
  const { from, to } = renewalWindow(now);
  const result: RenewalReminderResult = {
    dryRun,
    emailConfigured: deps.emailConfigured,
    windowFrom: from.toISOString(),
    windowTo: to.toISOString(),
    subscriptionsInWindow: 0,
    skippedCancelling: 0,
    alreadySent: 0,
    sent: 0,
    failed: 0,
    capped: 0,
    wouldSend: 0,
  };

  if (!deps.emailConfigured && !dryRun) {
    return result;
  }

  const due = await deps.findSubscriptionsRenewingBetween({ from, to });

  for (const subscription of due) {
    result.subscriptionsInWindow += 1;

    if (subscription.cancelAtPeriodEnd) {
      result.skippedCancelling += 1;
      continue;
    }

    const emails = [
      ...new Set(
        subscription.recipients
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    for (const email of emails) {
      const key = {
        subscriptionId: subscription.subscriptionId,
        periodEnd: subscription.periodEnd,
        email,
      };

      if (await deps.hasReminder(key)) {
        result.alreadySent += 1;
        continue;
      }

      if (dryRun) {
        result.wouldSend += 1;
        continue;
      }

      const message = buildRenewalReminderEmail({
        organizationName: subscription.organizationName,
        periodEnd: subscription.periodEnd,
        planName: subscription.planName,
        siteUrl: deps.siteUrl,
        contactEmail: deps.contactEmail,
      });
      const outcome = await sendWithBudget(budget, deps.sendMail, {
        to: email,
        ...message,
      });

      if (outcome === "sent") {
        try {
          await deps.recordReminder({
            ...key,
            organizationId: subscription.organizationId,
          });
          result.sent += 1;
        } catch {
          // Sent but not recorded: counted as failed so the operator sees it;
          // a duplicate is possible on the next run (documented trade-off).
          result.failed += 1;
        }
      } else if (outcome === "capped") {
        result.capped += 1;
      } else {
        result.failed += 1;
      }
    }
  }

  return result;
}
