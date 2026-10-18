import "server-only";

import { prisma } from "@/lib/prisma";
import { isCheckoutKeyEnabled } from "@/lib/paladin/pricing";
import { logOperationalEvent } from "@/lib/paladin/logging";
import {
  assertStripeCatalogPriceMode,
} from "@/lib/stripe/modeSafety";
import {
  getCatalogBillingInterval,
  getCatalogPlanName,
  getCoverageCatalogKey,
  getStripePriceId,
  type CheckoutCatalogKey,
} from "@/lib/stripe/catalog";
import { getAppUrl, stripe } from "@/lib/stripe";
import type { StripeCatalogItem } from "@/lib/stripe/catalogTypes";
import { isSubscriptionVerificationActive } from "@/lib/stripe/subscriptions";

export type CheckoutUserContext = Awaited<ReturnType<typeof getCheckoutUserContext>>;

export class CheckoutFlowError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "CheckoutFlowError";
  }
}

export async function getCheckoutUserContext(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              acquisitionIntent: true,
              subscription: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return null;
  }

  const membership = user.memberships[0] ?? null;

  return {
    membership,
    organization: membership?.organization ?? null,
    user,
  };
}

export async function createSubscriptionCheckoutSession({
  catalogItem,
  userContext,
}: {
  catalogItem: StripeCatalogItem;
  userContext: NonNullable<CheckoutUserContext>;
}) {
  const { organization, user } = userContext;

  if (!organization) {
    throw new CheckoutFlowError(
      "Create an organization before starting billing.",
      409
    );
  }

  validateCoverageCatalogSelection({
    catalogItem,
    organization,
  });

  const appUrl = getAppUrl();
  const priceId = getStripePriceId(catalogItem.key as CheckoutCatalogKey);
  const planName = getCatalogPlanName(catalogItem);
  const billingInterval = getCatalogBillingInterval(catalogItem);

  await assertStripeCatalogPriceMode({
    catalogItem,
    organizationId: organization.id,
  });

  const customerId = await getOrCreateStripeCustomer({
    createIfMissing: true,
    organization,
    user,
  });

  await prisma.subscription.upsert({
    where: {
      organizationId: organization.id,
    },
    create: {
      billingInterval,
      organizationId: organization.id,
      planName,
      status: "pending_checkout",
      stripeCustomerId: customerId,
      stripePriceId: priceId,
    },
    update: {
      billingInterval,
      planName,
      status: "pending_checkout",
      stripeCustomerId: customerId,
      stripePriceId: priceId,
    },
  });

  logOperationalEvent("info", "stripe_subscription_checkout_pending", {
    catalogKey: catalogItem.key,
    organizationId: organization.id,
    planName,
    priceId,
    status: "pending_checkout",
  });

  const checkoutMetadata = buildCheckoutMetadata({
    billingInterval,
    catalogItem,
    organizationId: organization.id,
    planName,
    userId: user.id,
  });

  const checkoutSession = await stripe.checkout.sessions.create(
    {
      allow_promotion_codes: true,
      client_reference_id: organization.id,
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: checkoutMetadata,
      mode: "subscription",
      subscription_data: {
        metadata: checkoutMetadata,
      },
      success_url: `${appUrl}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancel`,
    },
    {
      idempotencyKey: `checkout_${organization.id}_${priceId}_${billingInterval}`,
    }
  );

  logOperationalEvent("info", "stripe_checkout_session_created", {
    catalogKey: catalogItem.key,
    checkoutMode: "subscription",
    checkoutSessionId: checkoutSession.id,
    organizationId: organization.id,
    priceId,
  });

  return checkoutSession;
}

export async function getOrCreateStripeCustomer({
  createIfMissing,
  organization,
  user,
}: {
  createIfMissing: boolean;
  organization: NonNullable<NonNullable<CheckoutUserContext>["organization"]>;
  user: NonNullable<NonNullable<CheckoutUserContext>["user"]>;
}) {
  const existingCustomerId = organization.subscription?.stripeCustomerId;

  if (existingCustomerId) {
    await stripe.customers.update(existingCustomerId, {
      metadata: {
        organization_id: organization.id,
        user_id: user.id,
      },
      name: organization.name,
    });

    return existingCustomerId;
  }

  if (!createIfMissing) {
    return "";
  }

  const customer = await stripe.customers.create(
    {
      email: user.email,
      metadata: {
        organization_id: organization.id,
        user_id: user.id,
      },
      name: organization.name,
    },
    {
      idempotencyKey: `customer_${organization.id}`,
    }
  );

  await prisma.subscription.updateMany({
    where: {
      organizationId: organization.id,
    },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

export function buildCheckoutMetadata({
  billingInterval,
  catalogItem,
  organizationId,
  planName,
  quantity,
  userId,
}: {
  billingInterval: string;
  catalogItem: StripeCatalogItem;
  organizationId: string;
  planName: string;
  quantity?: number;
  userId: string;
}) {
  return {
    billing_interval: billingInterval,
    ...(quantity ? { binder_quantity: String(quantity) } : {}),
    catalog_key: catalogItem.key,
    checkout_mode: catalogItem.mode,
    organization_id: organizationId,
    plan_name: planName,
    price_id: catalogItem.priceId,
    product_family: catalogItem.family,
    product_id: catalogItem.productId,
    user_id: userId,
  };
}

function validateCoverageCatalogSelection({
  catalogItem,
  organization,
}: {
  catalogItem: StripeCatalogItem;
  organization: NonNullable<NonNullable<CheckoutUserContext>["organization"]>;
}) {
  if (!isCheckoutKeyEnabled(catalogItem.key)) {
    throw new CheckoutFlowError(
      "This plan is not available for self-serve checkout. Please contact Paladin support.",
      403
    );
  }

  const acquisitionIntent = organization.acquisitionIntent;
  const currentSubscriptionStatus = organization.subscription?.status;

  if (isSubscriptionVerificationActive(currentSubscriptionStatus)) {
    logOperationalEvent("warn", "stripe_checkout_active_subscription_exists", {
      catalogKey: catalogItem.key,
      organizationId: organization.id,
      subscriptionStatus: currentSubscriptionStatus,
    });

    throw new CheckoutFlowError(
      "Subscription is already active. Use Manage Billing or Upgrade Plan.",
      409
    );
  }

  if (!acquisitionIntent) {
    logOperationalEvent("warn", "stripe_checkout_missing_acquisition_intent", {
      catalogKey: catalogItem.key,
      organizationId: organization.id,
    });

    throw new CheckoutFlowError(
      "Select a plan before starting checkout.",
      409
    );
  }

  if (
    acquisitionIntent.plan === "ENTERPRISE" ||
    (acquisitionIntent.plan === "GROWTH" &&
      (acquisitionIntent.employeeCount ?? 0) > 250)
  ) {
    logOperationalEvent("warn", "stripe_checkout_enterprise_blocked", {
      catalogKey: catalogItem.key,
      employeeCount: acquisitionIntent.employeeCount,
      organizationId: organization.id,
      plan: acquisitionIntent.plan,
    });

    throw new CheckoutFlowError(
      "Enterprise organizations receive tailored billing. Please contact Paladin sales to continue.",
      403
    );
  }

  const expectedCatalogKey = getCoverageCatalogKey({
    employeeCount: acquisitionIntent.employeeCount,
    hipaaEnabled: acquisitionIntent.hipaaEnabled,
    plan: acquisitionIntent.plan,
  });

  if (catalogItem.key !== expectedCatalogKey) {
    logOperationalEvent("warn", "stripe_checkout_catalog_mismatch", {
      actualCatalogKey: catalogItem.key,
      expectedCatalogKey,
      organizationId: organization.id,
    });

    throw new CheckoutFlowError(
      "This checkout option does not match the saved organization plan.",
      400
    );
  }
}
