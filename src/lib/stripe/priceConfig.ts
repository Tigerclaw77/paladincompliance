// Test/live Stripe price-id resolution. Pure, no server-only imports, unit
// tested. The repository only ever contains TEST price ids (priceIds.ts).
// Live price ids are supplied at deploy time through the
// STRIPE_LIVE_PRICE_IDS_JSON environment variable, for example:
//   {"starter":"price_...","complianceBinder":"price_...","additionalBinder":"price_..."}
// Keys that are missing stay blank and fail closed ("not connected to a Stripe
// price yet"). Test ids are never used while live keys are configured.

export type StripePriceMappingShape = { priceId: string; productId: string };

export type PriceMode = "live" | "test" | null;

const PRICE_ID_PATTERN = /^price_[A-Za-z0-9]+$/;

export function parseLivePriceIds(raw: string | undefined | null): {
  ids: Record<string, string>;
  errors: string[];
} {
  const errors: string[] = [];
  const ids: Record<string, string> = {};

  if (!raw || !raw.trim()) {
    return { errors, ids };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { errors: ["STRIPE_LIVE_PRICE_IDS_JSON is not valid JSON."], ids };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { errors: ["STRIPE_LIVE_PRICE_IDS_JSON must be a JSON object."], ids };
  }

  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === "string" && PRICE_ID_PATTERN.test(value)) {
      ids[key] = value;
    } else {
      errors.push(`Ignoring invalid price id for "${key}".`);
    }
  }

  return { errors, ids };
}

export function resolvePriceMappings<K extends string>({
  liveJson,
  mode,
  testMappings,
}: {
  liveJson: string | undefined | null;
  mode: PriceMode;
  testMappings: Record<K, StripePriceMappingShape>;
}): Record<K, StripePriceMappingShape> {
  if (mode !== "live") {
    return testMappings;
  }

  const { ids } = parseLivePriceIds(liveJson);
  const resolved = {} as Record<K, StripePriceMappingShape>;
  const testIds = new Set(
    Object.values<StripePriceMappingShape>(testMappings).map((m) => m.priceId)
  );

  for (const key of Object.keys(testMappings) as K[]) {
    const priceId = ids[key] && !testIds.has(ids[key]) ? ids[key] : "";

    // Product ids differ between test and live; checkout only needs the price.
    resolved[key] = { priceId, productId: "" };
  }

  return resolved;
}
