import "server-only";

import { logOperationalEvent } from "@/lib/paladin/logging";
import {
  buildGuestStarterMetadata,
  type GuestStarterCatalogKey,
  type GuestStarterInput,
} from "@/lib/paladin/guestStarter";
import { getAppUrl, stripe } from "@/lib/stripe";
import { getStripeCatalogItem } from "@/lib/stripe/catalog";
import { buildCheckoutMetadata } from "@/lib/stripe/checkout";
import { assertStripeCatalogPriceMode } from "@/lib/stripe/modeSafety";

/**
 * Creates a Stripe Checkout Session for Starter without an account or
 * organization. The organization, user, and membership are created by the
 * Stripe webhook after payment (see guestProvisioning.ts).
 */
export async function createGuestStarterCheckoutSession({
  catalogKey,
  input,
}: {
  catalogKey: GuestStarterCatalogKey;
  input: GuestStarterInput;
}) {
  const catalogItem = getStripeCatalogItem(catalogKey);

  await assertStripeCatalogPriceMode({ catalogItem });

  const metadata = {
    ...buildCheckoutMetadata({
      billingInterval: "year",
      catalogItem,
      organizationId: "",
      planName: catalogItem.displayName,
      userId: "",
    }),
    ...buildGuestStarterMetadata(input),
  };
  const appUrl = getAppUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    customer_email: input.email,
    line_items: [{ price: catalogItem.priceId, quantity: 1 }],
    metadata,
    mode: "subscription",
    // The initial physical binder ships with new memberships.
    shipping_address_collection: { allowed_countries: ["US"] },
    subscription_data: { metadata },
    success_url: `${appUrl}/success?checkout=starter-success`,
    cancel_url: `${appUrl}/start/starter?checkout=cancel`,
  });

  logOperationalEvent("info", "stripe_guest_starter_checkout_created", {
    catalogKey,
    checkoutSessionId: checkoutSession.id,
    priceId: catalogItem.priceId,
  });

  return checkoutSession;
}
