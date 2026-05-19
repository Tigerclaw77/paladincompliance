import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertStripeServerConfig,
  getAppUrl,
  stripe,
} from "@/lib/stripe";
import { logOperationalEvent } from "@/lib/paladin/logging";
import {
  assertStripeCatalogPriceMode,
  StripeCatalogModeError,
} from "@/lib/stripe/modeSafety";
import {
  getCatalogBillingInterval,
  getCatalogPlanName,
  getCoverageCatalogKey,
  isConfiguredStripePriceId,
  getStripeCatalogItem,
  getStripePriceId,
  normalizeCheckoutCatalogKey,
  requiresActiveCoverage,
  type CheckoutCatalogKey,
} from "@/lib/stripe/catalog";
import { isSubscriptionVerificationActive } from "@/lib/stripe/subscriptions";

export const runtime = "nodejs";

const MIN_BINDER_QUANTITY = 1;
const MAX_BINDER_QUANTITY = 25;

type CreateCheckoutSessionBody = {
  priceKey?: string;
  quantity?: unknown;
};

type CheckoutUserContext = Awaited<ReturnType<typeof getCheckoutUserContext>>;

export async function POST(request: NextRequest) {
  try {
    assertStripeServerConfig();

    const session = await auth();

    const body = (await request
      .json()
      .catch(() => null)) as CreateCheckoutSessionBody | null;

    if (!body) {
      return NextResponse.json(
        { error: "A JSON request body is required." },
        { status: 400 }
      );
    }

    const catalogItem = getAllowedCatalogItem(body);
    const quantityResult = getCheckoutQuantity(body.quantity, catalogItem);

    if (!catalogItem) {
      return NextResponse.json(
        {
          error:
            "This billing option is not configured for checkout yet. Please contact Paladin support.",
        },
        { status: 400 }
      );
    }

    if (!isConfiguredStripePriceId(catalogItem.priceId)) {
      return NextResponse.json(
        {
          error:
            "This billing option is not connected to a Stripe price yet. Please contact Paladin support.",
        },
        { status: 400 }
      );
    }

    if (!quantityResult.ok) {
      return NextResponse.json(
        {
          error: quantityResult.error,
        },
        { status: 400 }
      );
    }

    const userContext = session?.user?.email
      ? await getCheckoutUserContext(session.user.email)
      : null;

    logOperationalEvent("info", "stripe_checkout_requested", {
      catalogKey: catalogItem.key,
      checkoutMode: catalogItem.mode,
      organizationId: userContext?.organization?.id,
      priceId: catalogItem.priceId,
      quantity: quantityResult.quantity,
    });

    if (catalogItem.mode === "subscription") {
      if (!userContext?.organization) {
        logOperationalEvent("warn", "stripe_checkout_organization_required", {
          catalogKey: catalogItem.key,
          checkoutMode: catalogItem.mode,
        });

        return NextResponse.json(
          { error: "Create an organization before starting coverage." },
          { status: session?.user?.email ? 409 : 401 }
        );
      }

      return createSubscriptionCheckoutSession({
        catalogItem,
        userContext,
      });
    }

    if (requiresActiveCoverage(catalogItem) && !userContext?.organization) {
      logOperationalEvent("warn", "stripe_checkout_active_coverage_signin_required", {
        catalogKey: catalogItem.key,
      });

      return NextResponse.json(
        { error: "Sign in with an active Paladin organization to order this binder." },
        { status: 401 }
      );
    }

    if (
      requiresActiveCoverage(catalogItem) &&
      !isSubscriptionVerificationActive(userContext?.organization?.subscription?.status)
    ) {
      logOperationalEvent("warn", "stripe_checkout_active_coverage_required", {
        catalogKey: catalogItem.key,
        organizationId: userContext?.organization?.id,
        subscriptionStatus: userContext?.organization?.subscription?.status,
      });

      return NextResponse.json(
        {
          error:
            "Additional binders are available after organizational coverage is active.",
        },
        { status: 403 }
      );
    }

    return createPaymentCheckoutSession({
      catalogItem,
      quantity: quantityResult.quantity,
      userContext,
    });
  } catch (error) {
    if (error instanceof StripeCatalogModeError) {
      return NextResponse.json(
        {
          error:
            "This billing option is not available for the configured Stripe environment. Please contact Paladin support.",
        },
        { status: 500 }
      );
    }

    logOperationalEvent("error", "stripe_checkout_session_failed", {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create Stripe Checkout Session",
    });

    return NextResponse.json(
      {
        error:
          "Checkout could not be started. Please try again or contact Paladin support.",
      },
      { status: 500 }
    );
  }
}

function getAllowedCatalogItem(body: CreateCheckoutSessionBody) {
  const priceKey =
    typeof body.priceKey === "string"
      ? normalizeCheckoutCatalogKey(body.priceKey)
      : null;

  return priceKey ? getStripeCatalogItem(priceKey) : null;
}

function getCheckoutQuantity(
  value: unknown,
  catalogItem: ReturnType<typeof getStripeCatalogItem> | null
) {
  if (!catalogItem || catalogItem.family !== "binder") {
    return {
      ok: true as const,
      quantity: 1,
    };
  }

  const quantity =
    value === undefined || value === null || value === ""
      ? 1
      : Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_BINDER_QUANTITY ||
    quantity > MAX_BINDER_QUANTITY
  ) {
    return {
      error: `Binder quantity must be between ${MIN_BINDER_QUANTITY} and ${MAX_BINDER_QUANTITY}.`,
      ok: false as const,
    };
  }

  return {
    ok: true as const,
    quantity,
  };
}

async function createSubscriptionCheckoutSession({
  catalogItem,
  userContext,
}: {
  catalogItem: ReturnType<typeof getStripeCatalogItem>;
  userContext: NonNullable<CheckoutUserContext>;
}) {
  const { organization, user } = userContext;

  if (!organization) {
    return NextResponse.json(
      { error: "Create an organization before starting coverage." },
      { status: 409 }
    );
  }

  const coverageValidation = validateCoverageCatalogSelection({
    catalogItem,
    organization,
  });

  if (coverageValidation) {
    return coverageValidation;
  }

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
      metadata: buildCheckoutMetadata({
        billingInterval,
        catalogItem,
        organizationId: organization.id,
        planName,
        userId: user.id,
      }),
      mode: "subscription",
      subscription_data: {
        metadata: buildCheckoutMetadata({
          billingInterval,
          catalogItem,
          organizationId: organization.id,
          planName,
          userId: user.id,
        }),
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

  return getCheckoutResponse(checkoutSession);
}

async function createPaymentCheckoutSession({
  catalogItem,
  quantity,
  userContext,
}: {
  catalogItem: ReturnType<typeof getStripeCatalogItem>;
  quantity: number;
  userContext: CheckoutUserContext;
}) {
  const appUrl = getAppUrl();
  const organization = userContext?.organization ?? null;
  const user = userContext?.user ?? null;
  const customerId = organization && user
    ? await getOrCreateStripeCustomer({
        createIfMissing: requiresActiveCoverage(catalogItem),
        organization,
        user,
      })
    : "";
  const priceId = getStripePriceId(catalogItem.key as CheckoutCatalogKey);

  await assertStripeCatalogPriceMode({
    catalogItem,
    organizationId: organization?.id,
  });

  const metadata = buildCheckoutMetadata({
    billingInterval: "one_time",
    catalogItem,
    organizationId: organization?.id ?? "",
    planName: catalogItem.displayName,
    quantity,
    userId: user?.id ?? "",
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    client_reference_id: organization?.id,
    customer: customerId || undefined,
    customer_email: customerId ? undefined : user?.email ?? undefined,
    line_items: [
      {
        adjustable_quantity: {
          enabled: true,
          maximum: MAX_BINDER_QUANTITY,
          minimum: MIN_BINDER_QUANTITY,
        },
        price: priceId,
        quantity,
      },
    ],
    metadata,
    mode: "payment",
    payment_intent_data: {
      metadata,
    },
    success_url: organization
      ? `${appUrl}/dashboard/assets?checkout=binder-success`
      : `${appUrl}/success?checkout=binder-success`,
    cancel_url: organization
      ? `${appUrl}/dashboard/assets?checkout=binder-cancel`
      : `${appUrl}/pricing?checkout=binder-cancel`,
  });

  logOperationalEvent("info", "stripe_checkout_session_created", {
    catalogKey: catalogItem.key,
    checkoutMode: "payment",
    checkoutSessionId: checkoutSession.id,
    organizationId: organization?.id,
    priceId,
    quantity,
  });

  return getCheckoutResponse(checkoutSession);
}

async function getCheckoutResponse(checkoutSession: { id: string; url: string | null }) {
  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Stripe did not return a Checkout Session URL." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  });
}

async function getCheckoutUserContext(email: string) {
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

function validateCoverageCatalogSelection({
  catalogItem,
  organization,
}: {
  catalogItem: ReturnType<typeof getStripeCatalogItem>;
  organization: NonNullable<NonNullable<CheckoutUserContext>["organization"]>;
}) {
  const acquisitionIntent = organization.acquisitionIntent;

  if (!acquisitionIntent) {
    logOperationalEvent("warn", "stripe_checkout_missing_acquisition_intent", {
      catalogKey: catalogItem.key,
      organizationId: organization.id,
    });

    return NextResponse.json(
      {
        error:
          "Select a coverage plan before starting checkout so Paladin can apply the correct catalog price.",
      },
      { status: 409 }
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

    return NextResponse.json(
      {
        error:
          "Enterprise organizations receive tailored coverage. Please contact Paladin sales to continue.",
      },
      { status: 403 }
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

    return NextResponse.json(
      {
        error:
          "This checkout option does not match the saved organization plan. Return to the start flow and confirm coverage.",
      },
      { status: 400 }
    );
  }

  return null;
}

async function getOrCreateStripeCustomer({
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

function buildCheckoutMetadata({
  billingInterval,
  catalogItem,
  organizationId,
  planName,
  quantity,
  userId,
}: {
  billingInterval: string;
  catalogItem: ReturnType<typeof getStripeCatalogItem>;
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
