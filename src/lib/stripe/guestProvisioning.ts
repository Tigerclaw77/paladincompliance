import "server-only";

import { MembershipRole, PlanTier, Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { isGuestCheckoutMetadata } from "@/lib/paladin/guestStarter";
import {
  appendNumericSlugSuffix,
  createSlugFromOrganizationName,
} from "@/lib/paladin/slugs";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getStripeCatalogItem } from "@/lib/stripe/catalog";
import {
  isSubscriptionVerificationActive,
  syncStripeSubscription,
} from "@/lib/stripe/subscriptions";

export function isGuestStarterCheckoutSession(
  checkoutSession: Stripe.Checkout.Session
) {
  return (
    checkoutSession.mode === "subscription" &&
    !checkoutSession.client_reference_id &&
    isGuestCheckoutMetadata(checkoutSession.metadata)
  );
}

/**
 * Called from the webhook after a guest Starter payment. Creates (or attaches
 * to) the user + organization, links the Stripe customer/subscription, then
 * runs the normal subscription sync. Safe to re-run: it resolves an existing
 * organization by Stripe subscription/customer id first.
 */
export async function provisionGuestStarterOrganization(
  checkoutSession: Stripe.Checkout.Session,
  context: { eventId: string; eventType: string }
) {
  const metadata = checkoutSession.metadata ?? {};
  const email = (
    metadata.contact_email ||
    checkoutSession.customer_details?.email ||
    checkoutSession.customer_email ||
    ""
  )
    .trim()
    .toLowerCase();
  const customerId = getStripeId(checkoutSession.customer);
  const subscriptionId = getStripeId(checkoutSession.subscription);

  if (!email || !customerId || !subscriptionId) {
    // Throwing makes the webhook return 500 so Stripe retries and the failure is visible.
    throw new Error("Guest Starter checkout is missing email, customer, or subscription.");
  }

  const existing = await prisma.subscription.findFirst({
    select: { organizationId: true },
    where: {
      OR: [
        { stripeSubscriptionId: subscriptionId },
        { stripeCustomerId: customerId },
      ],
    },
  });

  let organizationId = existing?.organizationId ?? "";
  let userId = "";

  if (!organizationId) {
    const provisioned = await createOrganizationForGuest({
      catalogKey: metadata.catalog_key === "starterHipaa" ? "starterHipaa" : "starter",
      customerId,
      email,
      industry: metadata.industry ?? "",
      organizationName: (metadata.organization_name || email).slice(0, 96),
      subscriptionId,
    });

    organizationId = provisioned.organizationId;
    userId = provisioned.userId;

    logOperationalEvent("info", "stripe_guest_starter_organization_provisioned", {
      checkoutSessionId: checkoutSession.id,
      eventId: context.eventId,
      organizationId,
      reusedExistingOrganization: provisioned.reusedExistingOrganization,
      shippingAddressCollected: Boolean(
        checkoutSession.collected_information?.shipping_details?.address
      ),
    });
  }

  // Make later subscription events resolve the organization from metadata.
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      ...metadata,
      organization_id: organizationId,
      ...(userId ? { user_id: userId } : {}),
    },
  });

  await stripe.customers
    .update(customerId, {
      metadata: { organization_id: organizationId },
      name: metadata.organization_name || undefined,
    })
    .catch((error: unknown) => {
      logOperationalEvent("warn", "stripe_guest_starter_customer_update_failed", {
        error: error instanceof Error ? error.message : "unknown",
        organizationId,
      });
    });

  await syncStripeSubscription(subscription, context);
}

async function createOrganizationForGuest({
  catalogKey,
  customerId,
  email,
  industry,
  organizationName,
  subscriptionId,
}: {
  catalogKey: "starter" | "starterHipaa";
  customerId: string;
  email: string;
  industry: string;
  organizationName: string;
  subscriptionId: string;
}) {
  const catalogItem = getStripeCatalogItem(catalogKey);
  const user = await prisma.user.upsert({
    create: { email },
    include: {
      memberships: {
        include: { organization: { include: { subscription: true } } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    update: {},
    where: { email },
  });

  const existingOrganization = user.memberships[0]?.organization ?? null;
  const subscriptionData = {
    billingInterval: "year",
    planName: catalogItem.hipaa ? "Starter + Optional HIPAA Add-On" : "Starter",
    status: "pending_checkout",
    stripeCustomerId: customerId,
    stripePriceId: catalogItem.priceId,
    stripeSubscriptionId: subscriptionId,
  };
  const intentData = {
    billingInterval: "YEAR" as const,
    employeeCount: null,
    estimatedAnnualCents: catalogItem.amountCents,
    hipaaEnabled: catalogItem.hipaa,
    industry,
    plan: PlanTier.STARTER,
  };

  // Existing account that has not bought coverage yet: attach to it.
  if (
    existingOrganization &&
    !isSubscriptionVerificationActive(existingOrganization.subscription?.status) &&
    !existingOrganization.subscription?.stripeSubscriptionId
  ) {
    await prisma.$transaction([
      prisma.subscription.upsert({
        create: { ...subscriptionData, organizationId: existingOrganization.id },
        update: subscriptionData,
        where: { organizationId: existingOrganization.id },
      }),
      prisma.acquisitionIntent.upsert({
        create: { ...intentData, organizationId: existingOrganization.id },
        update: intentData,
        where: { organizationId: existingOrganization.id },
      }),
    ]);

    return {
      organizationId: existingOrganization.id,
      reusedExistingOrganization: true,
      userId: user.id,
    };
  }

  if (existingOrganization) {
    // Paid, but this email already owns an organization with its own
    // subscription. Create a separate organization so the payment is never
    // lost, and flag for manual review.
    logOperationalEvent("warn", "stripe_guest_starter_email_has_active_organization", {
      existingOrganizationId: existingOrganization.id,
      userId: user.id,
    });
  }

  const slug = await getUniqueOrganizationSlug(
    createSlugFromOrganizationName(organizationName) || "organization"
  );

  try {
    const organization = await prisma.organization.create({
      data: {
        acquisitionIntent: { create: intentData },
        memberships: { create: { role: MembershipRole.OWNER, userId: user.id } },
        name: organizationName,
        slug,
        subscription: { create: subscriptionData },
        verificationPage: {
          create: { publicTitle: organizationName, slug, status: "draft" },
        },
      },
      select: { id: true },
    });

    return {
      organizationId: organization.id,
      reusedExistingOrganization: false,
      userId: user.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Concurrent delivery already created it; resolve by Stripe ids.
      const raced = await prisma.subscription.findFirst({
        select: { organizationId: true },
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (raced) {
        return {
          organizationId: raced.organizationId,
          reusedExistingOrganization: false,
          userId: user.id,
        };
      }
    }

    throw error;
  }
}

async function getUniqueOrganizationSlug(baseSlug: string) {
  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const candidate = appendNumericSlugSuffix(baseSlug, suffix);
    const [organization, verificationPage] = await prisma.$transaction([
      prisma.organization.findUnique({
        select: { id: true },
        where: { slug: candidate },
      }),
      prisma.verificationPage.findUnique({
        select: { id: true },
        where: { slug: candidate },
      }),
    ]);

    if (!organization && !verificationPage) {
      return candidate;
    }
  }

  throw new Error("Unable to allocate a unique organization slug.");
}

function getStripeId(value: string | { id: string } | null) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.id;
}
