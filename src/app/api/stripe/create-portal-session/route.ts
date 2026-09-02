import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertStripeServerConfig,
  getAppUrl,
  stripe,
} from "@/lib/stripe";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { getConfiguredStripeMode } from "@/lib/paladin/env";

export const runtime = "nodejs";

export async function POST() {
  try {
    assertStripeServerConfig();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
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

    const organization = user?.memberships[0]?.organization;
    const subscription = organization?.subscription;
    const customerId = subscription?.stripeCustomerId;

    if (!organization) {
      logOperationalEvent("warn", "stripe_portal_missing_organization");

      return NextResponse.json(
        {
          error:
            "Create or join a Paladin organization before managing billing.",
        },
        { status: 409 }
      );
    }

    if (!subscription) {
      logOperationalEvent("warn", "stripe_portal_missing_subscription", {
        organizationId: organization.id,
      });

      return NextResponse.json(
        {
          error:
            "No billing record is connected to this organization yet. Start coverage before managing billing.",
        },
        { status: 409 }
      );
    }

    if (!customerId) {
      logOperationalEvent("warn", "stripe_portal_missing_customer", {
        organizationId: organization?.id,
        subscriptionId: subscription.id,
      });

      return NextResponse.json(
        {
          error:
            "Billing portal access appears after Stripe creates the customer record for this organization.",
        },
        { status: 409 }
      );
    }

    if (!subscription.stripeSubscriptionId) {
      logOperationalEvent("warn", "stripe_portal_missing_subscription_id", {
        organizationId: organization.id,
        stripeCustomerId: customerId,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      });
    }

    logOperationalEvent("info", "stripe_portal_session_requested", {
      organizationId: organization.id,
      stripeCustomerId: customerId,
    });

    let portalCustomerId = customerId;
    let portalSession: Stripe.BillingPortal.Session;

    try {
      portalSession = await createBillingPortalSession(portalCustomerId);
    } catch (error) {
      if (!isMissingStripeCustomerError(error)) {
        throw error;
      }

      logOperationalEvent("warn", "stripe_portal_stale_customer_detected", {
        organizationId: organization.id,
        stripeMode: getConfiguredStripeMode() ?? "unknown",
        staleStripeCustomerId: customerId,
        subscriptionId: subscription.id,
      });

      portalCustomerId = await recreateStripeCustomerForPortal({
        organization,
        staleCustomerId: customerId,
        subscriptionId: subscription.id,
        user,
      });

      portalSession = await createBillingPortalSession(portalCustomerId);
    }

    logOperationalEvent("info", "stripe_portal_session_created", {
      organizationId: organization.id,
      portalSessionId: portalSession.id,
      stripeCustomerId: portalCustomerId,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    logOperationalEvent("error", "stripe_portal_session_failed", {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create Stripe billing portal session",
    });

    return NextResponse.json(
      {
        error:
          "Billing management could not be opened. Please try again or contact Paladin support.",
      },
      { status: 500 }
    );
  }
}

async function createBillingPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    configuration:
      process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID || undefined,
    customer: customerId,
    return_url: `${getAppUrl()}/dashboard/billing?portal=return`,
  });
}

async function recreateStripeCustomerForPortal({
  organization,
  staleCustomerId,
  subscriptionId,
  user,
}: {
  organization: { id: string; name: string };
  staleCustomerId: string;
  subscriptionId: string;
  user: { email: string; id: string };
}) {
  const customer = await stripe.customers.create(
    {
      email: user.email,
      metadata: {
        organization_id: organization.id,
        recovered_from_stale_customer_id: staleCustomerId,
        user_id: user.id,
      },
      name: organization.name,
    },
    {
      idempotencyKey: `portal_customer_recovery_${organization.id}_${staleCustomerId}`,
    }
  );

  logOperationalEvent("info", "stripe_portal_customer_recreated", {
    organizationId: organization.id,
    stripeMode: getConfiguredStripeMode() ?? "unknown",
    staleStripeCustomerId: staleCustomerId,
    stripeCustomerId: customer.id,
    subscriptionId,
  });

  await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  logOperationalEvent("info", "stripe_portal_customer_id_persisted", {
    organizationId: organization.id,
    stripeMode: getConfiguredStripeMode() ?? "unknown",
    staleStripeCustomerId: staleCustomerId,
    stripeCustomerId: customer.id,
    subscriptionId,
  });

  return customer.id;
}

function isMissingStripeCustomerError(error: unknown) {
  if (
    !(error instanceof Stripe.errors.StripeInvalidRequestError) &&
    (typeof error !== "object" || error === null)
  ) {
    return false;
  }

  const stripeError = error as {
    code?: string;
    message?: string;
    param?: string;
    raw?: {
      code?: string;
      message?: string;
      param?: string;
    };
  };
  const code = stripeError.code ?? stripeError.raw?.code;
  const message = stripeError.message ?? stripeError.raw?.message ?? "";
  const param = stripeError.param ?? stripeError.raw?.param;

  return (
    code === "resource_missing" &&
    (param === "customer" || message.includes("No such customer"))
  );
}
