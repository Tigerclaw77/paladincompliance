import {
  additionalBinderPriceKeys,
  checkoutPriceKeys,
  formatPaladinPrice,
  getCoveragePriceKey,
  getPaladinBillingInterval,
  getPaladinPlanName,
  getPaladinPriceItem,
  isCheckoutPriceKey,
  isPaladinPriceKey,
  normalizeCheckoutPriceKey,
  normalizePaladinPlanName,
  publicBinderPriceKeys,
  requiresActiveCoverage as requiresActiveCoverageForItem,
  type AdditionalBinderPriceKey,
  type CheckoutPriceKey,
  type CoveragePlanKey,
  type CoveragePriceKey,
  type LegacyCoveragePlanKey,
  type PaladinPriceKey,
  type PublicBinderPriceKey,
} from "@/lib/paladin/pricing";
import { getConfiguredStripeMode } from "@/lib/paladin/env";
import { STRIPE_PRICE_IDS as TEST_PRICE_IDS } from "@/lib/stripe/priceIds";
import { resolvePriceMappings } from "@/lib/stripe/priceConfig";
import type { StripeCatalogItem } from "@/lib/stripe/catalogTypes";

export type StripeCatalogKey = PaladinPriceKey;
export type { CoveragePlanKey };
export type CoverageCatalogKey = CoveragePriceKey;
export type PublicBinderCatalogKey = PublicBinderPriceKey;
export type AdditionalBinderCatalogKey = AdditionalBinderPriceKey;
export type CheckoutCatalogKey = CheckoutPriceKey;

const catalogKeys = Object.keys(TEST_PRICE_IDS) as StripeCatalogKey[];

/**
 * Price ids for the configured Stripe mode: the committed TEST ids unless live
 * keys are configured, in which case ids come only from
 * STRIPE_LIVE_PRICE_IDS_JSON (blank, so fail-closed, when absent).
 */
function getPriceMappings() {
  return resolvePriceMappings({
    liveJson: process.env.STRIPE_LIVE_PRICE_IDS_JSON,
    mode: getConfiguredStripeMode(),
    testMappings: TEST_PRICE_IDS,
  });
}

export const publicBinderCatalogKeys = publicBinderPriceKeys;
export const additionalBinderCatalogKeys = additionalBinderPriceKeys;


export function getStripeCatalogItem(
  catalogKey: StripeCatalogKey
): StripeCatalogItem {
  return {
    ...getPaladinPriceItem(catalogKey),
    ...getPriceMappings()[catalogKey],
  };
}

export function getStripeCatalogItemByPriceId(
  priceId: string | null | undefined
) {
  if (!priceId) {
    return null;
  }

  return (
    catalogKeys
      .map((catalogKey) => getStripeCatalogItem(catalogKey))
      .find((item) => item.priceId === priceId) ?? null
  );
}

export function getStripeCatalogItems<T extends StripeCatalogKey>(
  keys: readonly T[]
) {
  return keys.map((key) => getStripeCatalogItem(key));
}

export function isStripeCatalogKey(value: string): value is StripeCatalogKey {
  return isPaladinPriceKey(value) && catalogKeys.includes(value);
}

export function isCheckoutCatalogKey(value: string): value is CheckoutCatalogKey {
  return isCheckoutPriceKey(value);
}

export function normalizeCheckoutCatalogKey(
  value: string
): CheckoutCatalogKey | null {
  return normalizeCheckoutPriceKey(value);
}

export function getStripePriceId(catalogKey: StripeCatalogKey) {
  return getPriceMappings()[catalogKey].priceId;
}

export function isAllowedStripePriceId(priceId: string) {
  const mappings = getPriceMappings();

  return (
    isConfiguredStripePriceId(priceId) &&
    checkoutPriceKeys.some((catalogKey) => mappings[catalogKey].priceId === priceId)
  );
}

export function isConfiguredStripePriceId(priceId: string) {
  return /^price_[A-Za-z0-9]+$/.test(priceId);
}

export function getCoverageCatalogKey({
  employeeCount,
  hipaaEnabled = false,
  plan,
}: {
  employeeCount?: number | null;
  hipaaEnabled?: boolean | null;
  plan:
    | CoveragePlanKey
    | LegacyCoveragePlanKey
    | "GROWTH"
    | "STARTER";
}): CoverageCatalogKey {
  return getCoveragePriceKey({ employeeCount, hipaaEnabled, plan });
}

export function formatStripeCatalogPrice(
  item: Pick<StripeCatalogItem, "amountCents" | "interval">
) {
  return formatPaladinPrice(item);
}

export function getCatalogPlanName(item: StripeCatalogItem) {
  return getPaladinPlanName(item);
}

export function normalizeCatalogPlanName(planName: string | null | undefined) {
  return normalizePaladinPlanName(planName);
}

export function getCatalogBillingInterval(item: StripeCatalogItem) {
  return getPaladinBillingInterval(item);
}

export function requiresActiveCoverage(item: StripeCatalogItem) {
  return requiresActiveCoverageForItem(item);
}
