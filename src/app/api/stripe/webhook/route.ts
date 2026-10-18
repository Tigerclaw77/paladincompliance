import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import {
  getStripeWebhookSecret,
  stripe,
} from "@/lib/stripe";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { notifyOwnerOfOrder } from "@/lib/paladin/orders/notify";
import { prisma } from "@/lib/prisma";
import {
  isGuestStarterCheckoutSession,
  provisionGuestStarterOrganization,
} from "@/lib/stripe/guestProvisioning";
import {
  markSubscriptionInactive,
  syncStripeSubscription,
} from "@/lib/stripe/subscriptions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logOperationalEvent("warn", "stripe_webhook_missing_signature");

    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    logOperationalEvent("warn", "stripe_webhook_signature_invalid", {
      error: error instanceof Error ? error.message : "Invalid webhook",
    });

    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  logOperationalEvent("info", "stripe_webhook_received", {
    eventId: event.id,
    livemode: event.livemode,
    type: event.type,
  });

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });

    logOperationalEvent("info", "stripe_webhook_processing_started", {
      eventId: event.id,
      type: event.type,
    });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          event
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncStripeSubscription(event.data.object as Stripe.Subscription, {
          eventId: event.id,
          eventType: event.type,
        });
        break;
      case "customer.subscription.deleted":
        await markSubscriptionInactive(event.data.object as Stripe.Subscription, {
          eventId: event.id,
          eventType: event.type,
        });
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await handleInvoiceSubscriptionEvent(
          event.data.object as Stripe.Invoice,
          event
        );
        break;
      default:
        logOperationalEvent("info", "stripe_webhook_event_ignored", {
          eventId: event.id,
          type: event.type,
        });
        break;
    }

    logOperationalEvent("info", "stripe_webhook_processing_completed", {
      eventId: event.id,
      type: event.type,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      logOperationalEvent("info", "stripe_webhook_duplicate_race_ignored", {
        eventId: event.id,
        type: event.type,
      });

      return NextResponse.json({ duplicate: true, received: true });
    }

    await prisma.stripeWebhookEvent
      .delete({
        where: {
          id: event.id,
        },
      })
      .catch(() => null);

    logOperationalEvent("error", "stripe_webhook_processing_failed", {
      error: error instanceof Error ? error.message : "Unknown webhook error",
      eventId: event.id,
      type: event.type,
    });

    return NextResponse.json(
      { error: "Stripe webhook could not be processed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session,
  event: Stripe.Event
) {
  const shippingDetails =
    checkoutSession.collected_information?.shipping_details ?? null;

  logOperationalEvent("info", "stripe_checkout_session_completed_received", {
    binderQuantity: checkoutSession.metadata?.binder_quantity,
    catalogKey: checkoutSession.metadata?.catalog_key,
    checkoutMode: checkoutSession.mode ?? undefined,
    checkoutSessionId: checkoutSession.id,
    eventId: event.id,
    organizationId: checkoutSession.client_reference_id ?? undefined,
  });

  if (checkoutSession.mode !== "subscription") {
    if (checkoutSession.metadata?.product_family === "binder") {
      logOperationalEvent("info", "stripe_binder_checkout_completed", {
        binderQuantity: checkoutSession.metadata.binder_quantity,
        catalogKey: checkoutSession.metadata.catalog_key,
        checkoutSessionId: checkoutSession.id,
        eventId: event.id,
        organizationId: checkoutSession.client_reference_id ?? undefined,
        shippingAddressCollected: Boolean(shippingDetails?.address),
        shippingCountry: shippingDetails?.address?.country ?? undefined,
      });
      await notifyOwnerOfOrder(checkoutSession);
    }

    return;
  }

  if (isGuestStarterCheckoutSession(checkoutSession)) {
    if (checkoutSession.payment_status === "unpaid") {
      logOperationalEvent("warn", "stripe_guest_starter_unpaid_ignored", {
        checkoutSessionId: checkoutSession.id,
        eventId: event.id,
      });
      return;
    }

    await provisionGuestStarterOrganization(checkoutSession, {
      eventId: event.id,
      eventType: event.type,
    });
    await notifyOwnerOfOrder(checkoutSession);
    return;
  }

  const subscriptionId = getStripeId(checkoutSession.subscription);

  if (!subscriptionId) {
    logOperationalEvent("warn", "stripe_checkout_missing_subscription", {
      checkoutSessionId: checkoutSession.id,
      eventId: event.id,
      organizationId: checkoutSession.client_reference_id ?? undefined,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription, {
    eventId: event.id,
    eventType: event.type,
  });
}

async function handleInvoiceSubscriptionEvent(
  invoice: Stripe.Invoice,
  event: Stripe.Event
) {
  const subscriptionId = getStripeId(
    invoice.parent?.subscription_details?.subscription ?? null
  );

  logOperationalEvent("info", "stripe_invoice_event_received", {
    eventId: event.id,
    invoiceId: invoice.id,
    invoiceStatus: invoice.status ?? undefined,
    subscriptionId,
    type: event.type,
  });

  if (!subscriptionId) {
    logOperationalEvent("info", "stripe_invoice_without_subscription_ignored", {
      eventId: event.id,
      invoiceId: invoice.id,
      type: event.type,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription, {
    eventId: event.id,
    eventType: event.type,
  });
}

function getStripeId(value: string | { id: string } | null) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.id;
}
