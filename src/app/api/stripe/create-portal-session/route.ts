import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertStripeServerConfig,
  getAppUrl,
  stripe,
} from "@/lib/stripe";
import { logOperationalEvent } from "@/lib/paladin/logging";

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

    const portalSession = await stripe.billingPortal.sessions.create({
      configuration:
        process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID || undefined,
      customer: customerId,
      return_url: `${getAppUrl()}/dashboard/billing?portal=return`,
    });

    logOperationalEvent("info", "stripe_portal_session_created", {
      organizationId: organization.id,
      portalSessionId: portalSession.id,
      stripeCustomerId: customerId,
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
