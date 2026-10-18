import "server-only";

import { getSupportEmail, isEmailProviderConfigured } from "@/lib/paladin/env";
import { buildUnsubscribeUrl } from "@/lib/paladin/email/unsubscribe";
import {
  runComplianceReminders,
  type ComplianceReminderDeps,
} from "./complianceReminders";
import { createSendBudget, type SendBudget } from "./types";
import { getSiteOrigin } from "@/lib/paladin/siteUrl";
import { prisma } from "@/lib/prisma";
import { createSmtpMailer } from "./mailer";
import {
  runRenewalReminders,
  type RenewalReminderDeps,
} from "./renewalReminders";
import { releaseBinderRevision, type RevisionDeps, type RevisionInput } from "./revisions";
import type { Mailer } from "./types";

const ACTIVE_STATUSES = ["active", "trialing"];

function getUnsubscribeSecret() {
  return process.env.AUTH_SECRET ?? "";
}

function unsubscribeUrlFor(email: string) {
  return buildUnsubscribeUrl({
    email,
    secret: getUnsubscribeSecret(),
    siteUrl: getSiteOrigin(),
  });
}

async function listOptedOutEmails(emails: string[]) {
  if (emails.length === 0) {
    return new Set<string>();
  }

  const rows = await prisma.emailOptOut.findMany({
    select: { email: true },
    where: { email: { in: emails } },
  });

  return new Set(rows.map((row) => row.email.toLowerCase()));
}

export function getMaxEmailsPerRun() {
  const parsed = Number.parseInt(process.env.PALADIN_MAX_EMAILS_PER_RUN ?? "", 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function lazyMailer(): Mailer {
  let mailer: Mailer | null = null;

  return (message) => {
    mailer ??= createSmtpMailer();
    return mailer(message);
  };
}

export function buildRevisionDeps(overrides: Partial<RevisionDeps> = {}): RevisionDeps {
  return {
    emailConfigured: isEmailProviderConfigured(),
    listActiveSubscriberRecipients: async () => {
      const subscriptions = await prisma.subscription.findMany({
        include: {
          organization: {
            include: {
              memberships: {
                include: { user: { select: { email: true } } },
                where: { role: { in: ["OWNER", "ADMIN"] } },
              },
            },
          },
        },
        where: { status: { in: ACTIVE_STATUSES } },
      });

      return subscriptions.flatMap((subscription) =>
        subscription.organization.memberships.map((membership) => ({
          email: membership.user.email,
          organizationId: subscription.organizationId,
          organizationName: subscription.organization.name,
        }))
      );
    },
    listNoticedEmails: async (revisionId) => {
      const rows = await prisma.binderRevisionNotice.findMany({
        select: { email: true },
        where: { revisionId },
      });

      return new Set(rows.map((row) => row.email.toLowerCase()));
    },
    recordNotice: async (input) => {
      await prisma.binderRevisionNotice.upsert({
        create: input,
        update: {},
        where: {
          revisionId_email: { email: input.email, revisionId: input.revisionId },
        },
      });
    },
    contactEmail: getSupportEmail(),
    listOptedOutEmails,
    sendMail: lazyMailer(),
    siteUrl: getSiteOrigin(),
    unsubscribeUrlFor,
    upsertRevision: async (input) =>
      prisma.binderRevision.upsert({
        create: input,
        update: {},
        where: { version: input.version },
      }),
    ...overrides,
  };
}

export function buildRenewalReminderDeps(
  overrides: Partial<RenewalReminderDeps> = {}
): RenewalReminderDeps {
  return {
    emailConfigured: isEmailProviderConfigured(),
    findSubscriptionsRenewingBetween: async ({ from, to }) => {
      const subscriptions = await prisma.subscription.findMany({
        include: {
          organization: {
            include: {
              memberships: {
                include: { user: { select: { email: true } } },
                where: { role: { in: ["OWNER", "ADMIN"] } },
              },
            },
          },
        },
        where: {
          currentPeriodEnd: { gte: from, lte: to },
          status: { in: ACTIVE_STATUSES },
        },
      });

      return subscriptions.flatMap((subscription) =>
        subscription.currentPeriodEnd
          ? [
              {
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                organizationId: subscription.organizationId,
                organizationName: subscription.organization.name,
                periodEnd: subscription.currentPeriodEnd,
                planName: subscription.planName,
                recipients: subscription.organization.memberships.map(
                  (membership) => membership.user.email
                ),
                subscriptionId: subscription.id,
              },
            ]
          : []
      );
    },
    hasReminder: async ({ email, periodEnd, subscriptionId }) =>
      (await prisma.renewalReminder.count({
        where: { email, periodEnd, subscriptionId },
      })) > 0,
    recordReminder: async (input) => {
      await prisma.renewalReminder.upsert({
        create: input,
        update: {},
        where: {
          subscriptionId_periodEnd_email: {
            email: input.email,
            periodEnd: input.periodEnd,
            subscriptionId: input.subscriptionId,
          },
        },
      });
    },
    contactEmail: getSupportEmail(),
    sendMail: lazyMailer(),
    siteUrl: getSiteOrigin(),
    ...overrides,
  };
}

export function buildComplianceReminderDeps(
  overrides: Partial<ComplianceReminderDeps> = {}
): ComplianceReminderDeps {
  return {
    contactEmail: getSupportEmail(),
    emailConfigured: isEmailProviderConfigured(),
    hasReminder: async ({ dueDate, email, eventKey, organizationId }) =>
      (await prisma.complianceReminder.count({
        where: { dueDate: new Date(`${dueDate}T00:00:00.000Z`), email, eventKey, organizationId },
      })) > 0,
    listCalendarOrganizations: async () => {
      const subscriptions = await prisma.subscription.findMany({
        include: {
          organization: {
            include: {
              memberships: {
                include: { user: { select: { email: true } } },
                where: { role: { in: ["OWNER", "ADMIN"] } },
              },
            },
          },
        },
        where: {
          currentPeriodEnd: { not: null },
          currentPeriodStart: { not: null },
          status: { in: ACTIVE_STATUSES },
        },
      });

      return subscriptions.flatMap((subscription) =>
        subscription.currentPeriodStart && subscription.currentPeriodEnd
          ? [
              {
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                organizationId: subscription.organizationId,
                organizationName: subscription.organization.name,
                periodEnd: subscription.currentPeriodEnd,
                periodStart: subscription.currentPeriodStart,
                recipients: subscription.organization.memberships.map(
                  (membership) => membership.user.email
                ),
              },
            ]
          : []
      );
    },
    listOptedOutEmails,
    recordReminder: async ({ dueDate, email, eventKey, organizationId }) => {
      const date = new Date(`${dueDate}T00:00:00.000Z`);

      await prisma.complianceReminder.upsert({
        create: { dueDate: date, email, eventKey, organizationId },
        update: {},
        where: {
          organizationId_eventKey_dueDate_email: {
            dueDate: date,
            email,
            eventKey,
            organizationId,
          },
        },
      });
    },
    sendMail: lazyMailer(),
    siteUrl: getSiteOrigin(),
    unsubscribeUrlFor,
    ...overrides,
  };
}

export function releaseRevisionWithPrisma(
  input: RevisionInput,
  options: { budget?: SendBudget } = {}
) {
  return releaseBinderRevision(buildRevisionDeps(), input, {
    budget: options.budget ?? createSendBudget(getMaxEmailsPerRun()),
  });
}

export function runRenewalRemindersWithPrisma(options?: {
  budget?: SendBudget;
  dryRun?: boolean;
  now?: Date;
}) {
  return runRenewalReminders(buildRenewalReminderDeps(), options);
}

export function runComplianceRemindersWithPrisma(options?: {
  budget?: SendBudget;
  dryRun?: boolean;
  now?: Date;
}) {
  return runComplianceReminders(buildComplianceReminderDeps(), options);
}
