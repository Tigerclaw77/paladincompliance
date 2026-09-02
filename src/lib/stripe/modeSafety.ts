import "server-only";

import type { StripeCatalogItem } from "@/lib/stripe/catalogTypes";
import { getConfiguredStripeMode } from "@/lib/paladin/env";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { stripe } from "@/lib/stripe";

export class StripeCatalogModeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeCatalogModeError";
  }
}

export async function assertStripeCatalogPriceMode({
  catalogItem,
  organizationId,
}: {
  catalogItem: StripeCatalogItem;
  organizationId?: string | null;
}) {
  const expectedMode = getConfiguredStripeMode();

  if (!expectedMode) {
    throw new StripeCatalogModeError(
      "Stripe key mode could not be determined from configured keys."
    );
  }

  let stripePrice;

  try {
    stripePrice = await stripe.prices.retrieve(catalogItem.priceId);
  } catch (error) {
    logOperationalEvent("error", "stripe_catalog_price_lookup_failed", {
      catalogKey: catalogItem.key,
      error: error instanceof Error ? error.message : "Stripe price lookup failed",
      expectedMode,
      organizationId,
      priceId: catalogItem.priceId,
    });

    throw new StripeCatalogModeError(
      "This Stripe price is not available for the configured Stripe environment."
    );
  }

  const priceMode = stripePrice.livemode ? "live" : "test";

  if (priceMode !== expectedMode) {
    logOperationalEvent("error", "stripe_catalog_price_mode_mismatch", {
      catalogKey: catalogItem.key,
      expectedMode,
      organizationId,
      priceId: catalogItem.priceId,
      priceMode,
    });

    throw new StripeCatalogModeError(
      "Stripe catalog price mode does not match the configured Stripe keys."
    );
  }

  logOperationalEvent("info", "stripe_catalog_price_mode_validated", {
    catalogKey: catalogItem.key,
    organizationId,
    priceId: catalogItem.priceId,
    priceMode,
  });

  return stripePrice;
}
