import type Stripe from "stripe";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { resolveVerificationLifecycle } from "@/lib/paladin/verification";
import { prisma } from "@/lib/prisma";
import {
  getCatalogBillingInterval,
  getCatalogPlanName,
  getStripeCatalogItemByPriceId,
} from "@/lib/stripe/catalog";

const activeStatuses = new Set(["active", "trialing"]);
const renewalStatuses = new Set(["past_due", "unpaid"]);

type StripeSyncContext = {
  eventId?: string;
  eventType?: string;
};

type OrganizationResolution = {
  existingSubscriptionStatus?: string | null;
  organizationId: string;
  source: "existing_subscription" | "metadata" | "none";
};

export function getVerificationStatusForSubscription(status: string) {
  if (activeStatuses.has(status)) {
    return "verified";
  }

  if (renewalStatuses.has(status)) {
    return "pending_renewal";
  }

  return "inactive";
}

export function isSubscriptionVerificationActive(
  status: string | null | undefined
) {
  return status ? activeStatuses.has(status) : false;
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  context: StripeSyncContext = {}
) {
  const customerId = getStripeId(subscription.customer);
  const organizationResolution = await resolveOrganizationId(
    subscription,
    customerId
  );
  const organizationId = organizationResolution.organizationId;
  const price = subscription.items.data[0]?.price;
  const catalogItem = getStripeCatalogItemByPriceId(price?.id);
  const period = getSubscriptionPeriod(subscription);
  const nextVerificationStatus = getVerificationStatusForSubscription(
    subscription.status
  );

  logOperationalEvent("info", "stripe_subscription_sync_debug_lookup", {
    customerId,
    eventId: context.eventId,
    eventType: context.eventType,
    existingSubscriptionStatus:
      organizationResolution.existingSubscriptionStatus,
    organizationId: organizationId || undefined,
    organizationLookupSource: organizationResolution.source,
    stripeSubscriptionId: subscription.id,
  });

  logOperationalEvent("info", "stripe_subscription_sync_debug_status", {
    catalogKey: catalogItem?.key,
    currentPeriodEnd: dateToLogValue(period.end),
    currentPeriodStart: dateToLogValue(period.start),
    eventId: context.eventId,
    eventType: context.eventType,
    mappedVerificationStatus: nextVerificationStatus,
    priceId: price?.id,
    stripeStatus: subscription.status,
    stripeSubscriptionId: subscription.id,
  });

  if (!organizationId || !customerId) {
    logOperationalEvent("warn", "stripe_subscription_without_organization", {
      customerId,
      eventId: context.eventId,
      eventType: context.eventType,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
    });
    return;
  }

  const existingSubscription = await prisma.subscription.findUnique({
    select: {
      billingInterval: true,
      planName: true,
      status: true,
      stripePriceId: true,
    },
    where: {
      organizationId,
    },
  });
  const [savedSubscription, verificationUpdate] = await prisma.$transaction([
    prisma.subscription.upsert({
      where: {
        organizationId,
      },
      select: {
        currentPeriodEnd: true,
        currentPeriodStart: true,
        id: true,
        status: true,
        stripeCustomerId: true,
        stripePriceId: true,
        stripeSubscriptionId: true,
      },
      create: {
        billingInterval: catalogItem
          ? getCatalogBillingInterval(catalogItem)
          : price?.recurring?.interval ?? null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: stripeTimestampToDate(subscription.canceled_at),
        currentPeriodEnd: period.end,
        currentPeriodStart: period.start,
        organizationId,
        planName: getSubscriptionPlanName({
          catalogItem,
          existingPlanName: existingSubscription?.planName,
          metadataPlanName: subscription.metadata.plan_name,
        }),
        status: subscription.status,
        stripeCustomerId: customerId,
        stripePriceId: price?.id ?? null,
        stripeSubscriptionId: subscription.id,
        trialEndsAt: stripeTimestampToDate(subscription.trial_end),
      },
      update: {
        billingInterval: catalogItem
          ? getCatalogBillingInterval(catalogItem)
          : existingSubscription?.billingInterval ??
            price?.recurring?.interval ??
            null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: stripeTimestampToDate(subscription.canceled_at),
        currentPeriodEnd: period.end,
        currentPeriodStart: period.start,
        planName: getSubscriptionPlanName({
          catalogItem,
          existingPlanName: existingSubscription?.planName,
          metadataPlanName: subscription.metadata.plan_name,
        }),
        status: subscription.status,
        stripeCustomerId: customerId,
        stripePriceId: price?.id ?? null,
        stripeSubscriptionId: subscription.id,
        trialEndsAt: stripeTimestampToDate(subscription.trial_end),
      },
    }),
    prisma.verificationPage.updateMany({
      where: {
        organizationId,
      },
      data: {
        publishedAt: activeStatuses.has(subscription.status)
          ? new Date()
          : undefined,
        status: nextVerificationStatus,
      },
    }),
  ]);
  const verificationPage = await prisma.verificationPage.findUnique({
    select: {
      status: true,
    },
    where: {
      organizationId,
    },
  });
  const resultingLifecycle = resolveVerificationLifecycle({
    currentPeriodEnd: savedSubscription.currentPeriodEnd,
    subscriptionStatus: savedSubscription.status,
    verificationStatus: verificationPage?.status,
  });

  logOperationalEvent("info", "stripe_subscription_sync_debug_persisted", {
    currentPeriodEnd: dateToLogValue(savedSubscription.currentPeriodEnd),
    currentPeriodStart: dateToLogValue(savedSubscription.currentPeriodStart),
    eventId: context.eventId,
    eventType: context.eventType,
    organizationId,
    persistedPriceId: savedSubscription.stripePriceId,
    persistedStatus: savedSubscription.status,
    persistedStripeCustomerId: savedSubscription.stripeCustomerId,
    persistedStripeSubscriptionId: savedSubscription.stripeSubscriptionId,
    resultingLifecycle: resultingLifecycle.badgeLabel,
    resultingLifecycleState: resultingLifecycle.state,
    stripeSubscriptionId: subscription.id,
    verificationPageStatus: verificationPage?.status,
    verificationUpdateCount: verificationUpdate.count,
  });

  logOperationalEvent("info", "stripe_subscription_state_synced", {
    catalogKey: catalogItem?.key,
    eventId: context.eventId,
    eventType: context.eventType,
    nextPriceId: price?.id,
    nextStatus: subscription.status,
    organizationId,
    previousPriceId: existingSubscription?.stripePriceId,
    previousStatus: existingSubscription?.status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    verificationStatus: nextVerificationStatus,
  });
  logOperationalEvent("info", "paladin_entitlement_state_updated", {
    catalogKey: catalogItem?.key,
    eventId: context.eventId,
    hasActiveSubscription: activeStatuses.has(subscription.status),
    organizationId,
    subscriptionStatus: subscription.status,
    verificationStatus: nextVerificationStatus,
  });
}

export async function markSubscriptionInactive(
  subscription: Stripe.Subscription,
  context: StripeSyncContext = {}
) {
  const customerId = getStripeId(subscription.customer);
  const organizationId = (
    await resolveOrganizationId(subscription, customerId)
  ).organizationId;
  const price = subscription.items.data[0]?.price;
  const catalogItem = getStripeCatalogItemByPriceId(price?.id);

  if (!organizationId || !customerId) {
    logOperationalEvent("warn", "stripe_deleted_subscription_without_organization", {
      customerId,
      eventId: context.eventId,
      eventType: context.eventType,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
    });
    return;
  }

  const existingSubscription = await prisma.subscription.findUnique({
    select: {
      billingInterval: true,
      planName: true,
      status: true,
      stripePriceId: true,
    },
    where: {
      organizationId,
    },
  });

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: {
        organizationId,
      },
      create: {
        billingInterval: catalogItem
          ? getCatalogBillingInterval(catalogItem)
          : price?.recurring?.interval ?? null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: stripeTimestampToDate(subscription.canceled_at) ?? new Date(),
        organizationId,
        planName: getSubscriptionPlanName({
          catalogItem,
          existingPlanName: existingSubscription?.planName,
          metadataPlanName: subscription.metadata.plan_name,
        }),
        status: "canceled",
        stripeCustomerId: customerId,
        stripePriceId: price?.id ?? null,
        stripeSubscriptionId: subscription.id,
      },
      update: {
        billingInterval: catalogItem
          ? getCatalogBillingInterval(catalogItem)
          : existingSubscription?.billingInterval ??
            price?.recurring?.interval ??
            null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: stripeTimestampToDate(subscription.canceled_at) ?? new Date(),
        planName: getSubscriptionPlanName({
          catalogItem,
          existingPlanName: existingSubscription?.planName,
          metadataPlanName: subscription.metadata.plan_name,
        }),
        status: "canceled",
        stripeCustomerId: customerId,
        stripePriceId: price?.id ?? null,
        stripeSubscriptionId: subscription.id,
      },
    }),
    prisma.verificationPage.updateMany({
      where: {
        organizationId,
      },
      data: {
        status: "inactive",
      },
    }),
  ]);

  logOperationalEvent("info", "stripe_subscription_state_synced", {
    catalogKey: catalogItem?.key,
    eventId: context.eventId,
    eventType: context.eventType,
    nextPriceId: price?.id,
    nextStatus: "canceled",
    organizationId,
    previousPriceId: existingSubscription?.stripePriceId,
    previousStatus: existingSubscription?.status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    verificationStatus: "inactive",
  });
  logOperationalEvent("info", "paladin_entitlement_state_updated", {
    catalogKey: catalogItem?.key,
    eventId: context.eventId,
    hasActiveSubscription: false,
    organizationId,
    subscriptionStatus: "canceled",
    verificationStatus: "inactive",
  });
}

export function stripeTimestampToDate(timestamp: number | null | undefined) {
  return typeof timestamp === "number" ? new Date(timestamp * 1000) : null;
}

function getStripeId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.id;
}

function getSubscriptionPlanName({
  catalogItem,
  existingPlanName,
  metadataPlanName,
}: {
  catalogItem: ReturnType<typeof getStripeCatalogItemByPriceId>;
  existingPlanName?: string | null;
  metadataPlanName?: string | null;
}) {
  if (catalogItem?.family === "coverage") {
    return getCatalogPlanName(catalogItem);
  }

  return metadataPlanName || existingPlanName || null;
}

async function resolveOrganizationId(
  subscription: Stripe.Subscription,
  customerId: string
): Promise<OrganizationResolution> {
  if (subscription.metadata.organization_id) {
    return {
      organizationId: subscription.metadata.organization_id,
      source: "metadata",
    };
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        {
          stripeSubscriptionId: subscription.id,
        },
        {
          stripeCustomerId: customerId,
        },
      ],
    },
    select: {
      organizationId: true,
      status: true,
    },
  });

  if (existingSubscription) {
    return {
      existingSubscriptionStatus: existingSubscription.status,
      organizationId: existingSubscription.organizationId,
      source: "existing_subscription",
    };
  }

  return {
    organizationId: "",
    source: "none",
  };
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
    current_period_start?: number | null;
  };

  return {
    end: stripeTimestampToDate(
      item?.current_period_end ?? subscriptionWithPeriod.current_period_end
    ),
    start: stripeTimestampToDate(
      item?.current_period_start ?? subscriptionWithPeriod.current_period_start
    ),
  };
}

function dateToLogValue(date: Date | null | undefined) {
  return date?.toISOString();
}
