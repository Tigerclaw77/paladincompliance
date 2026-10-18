import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
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
  isConfiguredStripePriceId,
  getStripeCatalogItem,
  getStripePriceId,
  normalizeCheckoutCatalogKey,
  requiresActiveCoverage,
  type CheckoutCatalogKey,
} from "@/lib/stripe/catalog";
import {
  buildCheckoutMetadata,
  CheckoutFlowError,
  createSubscriptionCheckoutSession,
  getCheckoutUserContext,
  getOrCreateStripeCustomer,
  type CheckoutUserContext,
} from "@/lib/stripe/checkout";
import { isSubscriptionVerificationActive } from "@/lib/stripe/subscriptions";
import {
  isGuestStarterCatalogKey,
  parseGuestStarterInput,
} from "@/lib/paladin/guestStarter";
import { isCheckoutKeyEnabled } from "@/lib/paladin/pricing";
import { createGuestStarterCheckoutSession } from "@/lib/stripe/guestCheckout";

export const runtime = "nodejs";

const MIN_BINDER_QUANTITY = 1;
const MAX_BINDER_QUANTITY = 25;

type CreateCheckoutSessionBody = {
  email?: unknown;
  industry?: unknown;
  organizationName?: unknown;
  priceKey?: string;
  quantity?: unknown;
  staffAttestation?: unknown;
};

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
      if (!userContext?.organization && isGuestStarterCatalogKey(catalogItem.key)) {
        // Guest Starter: no account yet. The organization is created by the
        // Stripe webhook after payment.
        const guestInput = parseGuestStarterInput(
          body as Record<string, unknown>
        );

        if (!guestInput.ok) {
          return NextResponse.json({ error: guestInput.error }, { status: 400 });
        }

        const checkoutSession = await createGuestStarterCheckoutSession({
          catalogKey: "starter",
          input: guestInput.value,
        });

        return getCheckoutResponse(checkoutSession);
      }

      if (!userContext?.organization) {
        logOperationalEvent("warn", "stripe_checkout_organization_required", {
          catalogKey: catalogItem.key,
          checkoutMode: catalogItem.mode,
        });

        return NextResponse.json(
          { error: "Create an organization before starting a subscription." },
          { status: session?.user?.email ? 409 : 401 }
        );
      }

      const checkoutSession = await createSubscriptionCheckoutSession({
        catalogItem,
        userContext,
      });

      return getCheckoutResponse(checkoutSession);
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
            "Additional binders are available after an active subscription is in place.",
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

    if (error instanceof CheckoutFlowError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.status }
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
          "Checkout is unavailable right now. Please try again or contact Paladin support.",
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

  return priceKey && isCheckoutKeyEnabled(priceKey)
    ? getStripeCatalogItem(priceKey)
    : null;
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
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    success_url: organization
      ? `${appUrl}/dashboard/assets?checkout=binder-success`
      : `${appUrl}/success?checkout=binder-success`,
    cancel_url: organization
      ? `${appUrl}/dashboard/assets?checkout=binder-cancel`
      : `${appUrl}/order?checkout=binder-cancel`,
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
