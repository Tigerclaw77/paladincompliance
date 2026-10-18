import "server-only";

import { isEmailProviderConfigured } from "@/lib/paladin/env";
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
    sendMail: lazyMailer(),
    siteUrl: getSiteOrigin(),
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
    sendMail: lazyMailer(),
    siteUrl: getSiteOrigin(),
    ...overrides,
  };
}

export function releaseRevisionWithPrisma(input: RevisionInput) {
  return releaseBinderRevision(buildRevisionDeps(), input);
}

export function runRenewalRemindersWithPrisma(options?: {
  dryRun?: boolean;
  now?: Date;
}) {
  return runRenewalReminders(buildRenewalReminderDeps(), options);
}
