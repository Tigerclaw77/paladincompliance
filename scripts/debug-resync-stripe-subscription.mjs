import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

loadLocalEnvFile(".env.local");
loadLocalEnvFile(".env");

const args = process.argv.slice(2);
const subscriptionId = args.find((arg) => arg.startsWith("sub_"));
const write = args.includes("--write");
const allowLive = args.includes("--allow-live");

if (!subscriptionId) {
  throw new Error(
    "Usage: node scripts/debug-resync-stripe-subscription.mjs sub_123 [--write] [--allow-live]"
  );
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY.");
}

const mode = stripeSecretKey.startsWith("sk_live_")
  ? "live"
  : stripeSecretKey.startsWith("sk_test_")
    ? "test"
    : "unknown";

if (mode === "unknown") {
  throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
}

if (mode === "live" && (!write || !allowLive)) {
  throw new Error(
    "Refusing live-mode resync. Re-run with --write --allow-live only if this is intentional."
  );
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/paladincompliance?schema=public";
const stripe = new Stripe(stripeSecretKey);
const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

console.log(`Stripe mode: ${mode.toUpperCase()}`);
console.log(write ? "Debug resync: WRITE" : "Debug resync: DRY RUN");
console.log(`Subscription: ${subscriptionId}`);

try {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
  const customerId = getStripeId(subscription.customer);
  const organizationResolution = await resolveOrganization(
    subscription,
    customerId
  );
  const price = subscription.items.data[0]?.price;
  const period = getSubscriptionPeriod(subscription);
  const verificationStatus = getVerificationStatusForSubscription(
    subscription.status
  );

  printJson("Resolved subscription", {
    currentPeriodEnd: dateToLogValue(period.end),
    currentPeriodStart: dateToLogValue(period.start),
    customerId,
    organizationId: organizationResolution.organizationId,
    organizationLookupSource: organizationResolution.source,
    priceId: price?.id ?? null,
    status: subscription.status,
    verificationStatus,
  });

  if (!organizationResolution.organizationId || !customerId) {
    throw new Error(
      "Could not resolve organization from subscription metadata, stripeSubscriptionId, or stripeCustomerId."
    );
  }

  const existingSubscription = await prisma.subscription.findUnique({
    where: {
      organizationId: organizationResolution.organizationId,
    },
    select: {
      billingInterval: true,
      planName: true,
      status: true,
      stripePriceId: true,
      stripeSubscriptionId: true,
    },
  });

  printJson("Existing local subscription", existingSubscription ?? {});

  if (!write) {
    console.log("");
    console.log("Dry run complete. Re-run with --write to update local Prisma rows.");
  } else {
    const [savedSubscription, verificationUpdate] = await prisma.$transaction([
      prisma.subscription.upsert({
        where: {
          organizationId: organizationResolution.organizationId,
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
          billingInterval: price?.recurring?.interval ?? null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: stripeTimestampToDate(subscription.canceled_at),
          currentPeriodEnd: period.end,
          currentPeriodStart: period.start,
          organizationId: organizationResolution.organizationId,
          planName: subscription.metadata.plan_name ?? null,
          status: subscription.status,
          stripeCustomerId: customerId,
          stripePriceId: price?.id ?? null,
          stripeSubscriptionId: subscription.id,
          trialEndsAt: stripeTimestampToDate(subscription.trial_end),
        },
        update: {
          billingInterval:
            existingSubscription?.billingInterval ??
            price?.recurring?.interval ??
            null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: stripeTimestampToDate(subscription.canceled_at),
          currentPeriodEnd: period.end,
          currentPeriodStart: period.start,
          planName:
            subscription.metadata.plan_name ??
            existingSubscription?.planName ??
            null,
          status: subscription.status,
          stripeCustomerId: customerId,
          stripePriceId: price?.id ?? null,
          stripeSubscriptionId: subscription.id,
          trialEndsAt: stripeTimestampToDate(subscription.trial_end),
        },
      }),
      prisma.verificationPage.updateMany({
        where: {
          organizationId: organizationResolution.organizationId,
        },
        data: {
          publishedAt: isActiveSubscriptionStatus(subscription.status)
            ? new Date()
            : undefined,
          status: verificationStatus,
        },
      }),
    ]);
    const verificationPage = await prisma.verificationPage.findUnique({
      where: {
        organizationId: organizationResolution.organizationId,
      },
      select: {
        status: true,
      },
    });
    const lifecycle = resolveLifecycle({
      currentPeriodEnd: savedSubscription.currentPeriodEnd,
      subscriptionStatus: savedSubscription.status,
      verificationStatus: verificationPage?.status,
    });

    printJson("Resync result", {
      currentPeriodEnd: dateToLogValue(savedSubscription.currentPeriodEnd),
      currentPeriodStart: dateToLogValue(savedSubscription.currentPeriodStart),
      lifecycle,
      persistedPriceId: savedSubscription.stripePriceId,
      persistedStatus: savedSubscription.status,
      persistedStripeCustomerId: savedSubscription.stripeCustomerId,
      persistedStripeSubscriptionId: savedSubscription.stripeSubscriptionId,
      verificationPageStatus: verificationPage?.status ?? null,
      verificationUpdateCount: verificationUpdate.count,
    });
  }
} finally {
  await prisma.$disconnect();
}

function getVerificationStatusForSubscription(status) {
  if (isActiveSubscriptionStatus(status)) {
    return "verified";
  }

  if (status === "past_due" || status === "unpaid") {
    return "pending_renewal";
  }

  return "inactive";
}

function isActiveSubscriptionStatus(status) {
  return status === "active" || status === "trialing";
}

async function resolveOrganization(subscription, customerId) {
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
    },
  });

  if (existingSubscription) {
    return {
      organizationId: existingSubscription.organizationId,
      source: "existing_subscription",
    };
  }

  return {
    organizationId: "",
    source: "none",
  };
}

function resolveLifecycle({
  currentPeriodEnd,
  subscriptionStatus,
  verificationStatus,
}) {
  const normalizedSubscriptionStatus = normalizeStatus(subscriptionStatus);
  const normalizedVerificationStatus = normalizeStatus(verificationStatus);
  const now = new Date();
  const renewalDueCutoff = new Date(now);
  renewalDueCutoff.setDate(renewalDueCutoff.getDate() + 30);
  const activeSubscription =
    normalizedSubscriptionStatus === "active" ||
    normalizedSubscriptionStatus === "trialing";
  const renewalDue =
    normalizedSubscriptionStatus === "past_due" ||
    normalizedSubscriptionStatus === "pending_renewal" ||
    normalizedSubscriptionStatus === "unpaid" ||
    normalizedVerificationStatus === "pending_renewal" ||
    (activeSubscription &&
      currentPeriodEnd &&
      currentPeriodEnd >= now &&
      currentPeriodEnd <= renewalDueCutoff);
  const expiredByDate =
    currentPeriodEnd &&
    currentPeriodEnd < now &&
    normalizedVerificationStatus !== "draft";
  const inactiveVerification = [
    "canceled",
    "cancelled",
    "expired",
    "inactive",
    "lapsed",
  ].includes(normalizedVerificationStatus);

  if (expiredByDate) {
    return "LAPSED";
  }

  if (renewalDue) {
    return "RENEWAL DUE";
  }

  if (activeSubscription && !inactiveVerification) {
    return "ACTIVE";
  }

  return "LAPSED";
}

function getStripeId(value) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.id;
}

function getSubscriptionPeriod(subscription) {
  const item = subscription.items.data[0];

  return {
    end: stripeTimestampToDate(
      item?.current_period_end ?? subscription.current_period_end
    ),
    start: stripeTimestampToDate(
      item?.current_period_start ?? subscription.current_period_start
    ),
  };
}

function stripeTimestampToDate(timestamp) {
  return typeof timestamp === "number" ? new Date(timestamp * 1000) : null;
}

function dateToLogValue(date) {
  return date?.toISOString() ?? null;
}

function normalizeStatus(status) {
  return status?.trim().toLowerCase() ?? "";
}

function printJson(label, value) {
  console.log("");
  console.log(`${label}:`);
  console.log(JSON.stringify(value, null, 2));
}

function loadLocalEnvFile(filename) {
  const envPath = resolve(process.cwd(), filename);

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}
