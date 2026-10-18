export type PaladinPriceFamily = "binder" | "coverage";
export type PaladinPriceMode = "payment" | "subscription";
export type PaladinPriceVisibility = "active_coverage" | "public";

export type PaladinPriceItem = {
  amountCents: number;
  currency: "usd";
  displayName: string;
  employeeRange: "1-25" | "26-50" | "51-100" | "101-250" | null;
  family: PaladinPriceFamily;
  hipaa: boolean;
  interval: "year" | null;
  key: string;
  mode: PaladinPriceMode;
  plan: "binder" | "operational" | "starter";
  visibility: PaladinPriceVisibility;
};

export const PALADIN_PRICING = {
  additionalBinder: {
    amountCents: 12500,
    currency: "usd",
    displayName: "Paladin Additional Binder",
    employeeRange: null,
    family: "binder",
    hipaa: false,
    interval: null,
    key: "additionalBinder",
    mode: "payment",
    plan: "binder",
    visibility: "active_coverage",
  },
  additionalBinderHipaa: {
    amountCents: 17499,
    currency: "usd",
    displayName: "Paladin Additional Binder + HIPAA",
    employeeRange: null,
    family: "binder",
    hipaa: true,
    interval: null,
    key: "additionalBinderHipaa",
    mode: "payment",
    plan: "binder",
    visibility: "active_coverage",
  },
  complianceBinder: {
    amountCents: 24999,
    currency: "usd",
    displayName: "Paladin Compliance Binder",
    employeeRange: null,
    family: "binder",
    hipaa: false,
    interval: null,
    key: "complianceBinder",
    mode: "payment",
    plan: "binder",
    visibility: "public",
  },
  complianceBinderHipaa: {
    amountCents: 34999,
    currency: "usd",
    displayName: "Paladin Compliance Binder + HIPAA",
    employeeRange: null,
    family: "binder",
    hipaa: true,
    interval: null,
    key: "complianceBinderHipaa",
    mode: "payment",
    plan: "binder",
    visibility: "public",
  },
  starter: {
    amountCents: 49900,
    currency: "usd",
    displayName: "Paladin Starter",
    employeeRange: "1-25",
    family: "coverage",
    hipaa: false,
    interval: "year",
    key: "starter",
    mode: "subscription",
    plan: "starter",
    visibility: "public",
  },
  starterHipaa: {
    amountCents: 69900,
    currency: "usd",
    displayName: "Paladin Starter + HIPAA",
    employeeRange: "1-25",
    family: "coverage",
    hipaa: true,
    interval: "year",
    key: "starterHipaa",
    mode: "subscription",
    plan: "starter",
    visibility: "public",
  },
  operational101To250: {
    amountCents: 499900,
    currency: "usd",
    displayName: "Paladin Operational 101-250",
    employeeRange: "101-250",
    family: "coverage",
    hipaa: false,
    interval: "year",
    key: "operational101To250",
    mode: "subscription",
    plan: "operational",
    visibility: "public",
  },
  operational101To250Hipaa: {
    amountCents: 699900,
    currency: "usd",
    displayName: "Paladin Operational 101-250 + HIPAA",
    employeeRange: "101-250",
    family: "coverage",
    hipaa: true,
    interval: "year",
    key: "operational101To250Hipaa",
    mode: "subscription",
    plan: "operational",
    visibility: "public",
  },
  operational26To50: {
    amountCents: 149900,
    currency: "usd",
    displayName: "Paladin Operational 26-50",
    employeeRange: "26-50",
    family: "coverage",
    hipaa: false,
    interval: "year",
    key: "operational26To50",
    mode: "subscription",
    plan: "operational",
    visibility: "public",
  },
  operational26To50Hipaa: {
    amountCents: 209900,
    currency: "usd",
    displayName: "Paladin Operational 26-50 + HIPAA",
    employeeRange: "26-50",
    family: "coverage",
    hipaa: true,
    interval: "year",
    key: "operational26To50Hipaa",
    mode: "subscription",
    plan: "operational",
    visibility: "public",
  },
  operational51To100: {
    amountCents: 249900,
    currency: "usd",
    displayName: "Paladin Operational 51-100",
    employeeRange: "51-100",
    family: "coverage",
    hipaa: false,
    interval: "year",
    key: "operational51To100",
    mode: "subscription",
    plan: "operational",
    visibility: "public",
  },
  operational51To100Hipaa: {
    amountCents: 349900,
    currency: "usd",
    displayName: "Paladin Operational 51-100 + HIPAA",
    employeeRange: "51-100",
    family: "coverage",
    hipaa: true,
    interval: "year",
    key: "operational51To100Hipaa",
    mode: "subscription",
    plan: "operational",
    visibility: "public",
  },
} as const satisfies Record<string, PaladinPriceItem>;

export type PaladinPriceKey = keyof typeof PALADIN_PRICING;
export type CoveragePlanKey = "operational" | "starter";
export type LegacyCoveragePlanKey = "foundation" | "growth";

export type CoveragePriceKey =
  | "operational101To250"
  | "operational101To250Hipaa"
  | "operational26To50"
  | "operational26To50Hipaa"
  | "operational51To100"
  | "operational51To100Hipaa"
  | "starter"
  | "starterHipaa";

export type LegacyCoveragePriceKey =
  | "foundation"
  | "foundationHipaa"
  | "growth101To250"
  | "growth101To250Hipaa"
  | "growth1To25"
  | "growth1To25Hipaa"
  | "growth26To100"
  | "growth26To100Hipaa";

export type PublicBinderPriceKey =
  | "complianceBinder"
  | "complianceBinderHipaa";

export type AdditionalBinderPriceKey =
  | "additionalBinder"
  | "additionalBinderHipaa";

export type CheckoutPriceKey =
  | AdditionalBinderPriceKey
  | CoveragePriceKey
  | PublicBinderPriceKey;

export const publicBinderPriceKeys: PublicBinderPriceKey[] = [
  "complianceBinder",
  "complianceBinderHipaa",
];

export const additionalBinderPriceKeys: AdditionalBinderPriceKey[] = [
  "additionalBinder",
  "additionalBinderHipaa",
];

export const legacyCoveragePriceKeyAliases = {
  foundation: "starter",
  foundationHipaa: "starterHipaa",
  growth101To250: "operational101To250",
  growth101To250Hipaa: "operational101To250Hipaa",
  growth1To25: "starter",
  growth1To25Hipaa: "starterHipaa",
  growth26To100: "operational51To100",
  growth26To100Hipaa: "operational51To100Hipaa",
} as const satisfies Record<LegacyCoveragePriceKey, CoveragePriceKey>;

export const checkoutPriceKeys: CheckoutPriceKey[] = [
  "starter",
  "starterHipaa",
  "operational26To50",
  "operational26To50Hipaa",
  "operational51To100",
  "operational51To100Hipaa",
  "operational101To250",
  "operational101To250Hipaa",
  "complianceBinder",
  "complianceBinderHipaa",
  "additionalBinder",
  "additionalBinderHipaa",
];

const priceKeys = Object.keys(PALADIN_PRICING) as PaladinPriceKey[];

export function getPaladinPriceItem(
  priceKey: PaladinPriceKey
): (typeof PALADIN_PRICING)[PaladinPriceKey] {
  return PALADIN_PRICING[priceKey];
}

export function getPaladinPriceItems<T extends PaladinPriceKey>(
  keys: readonly T[]
) {
  return keys.map((key) => getPaladinPriceItem(key));
}

export function isPaladinPriceKey(value: string): value is PaladinPriceKey {
  return priceKeys.includes(value as PaladinPriceKey);
}

export function isCheckoutPriceKey(value: string): value is CheckoutPriceKey {
  return checkoutPriceKeys.includes(value as CheckoutPriceKey);
}

export function normalizeCheckoutPriceKey(
  value: string
): CheckoutPriceKey | null {
  if (isCheckoutPriceKey(value)) {
    return value;
  }

  return (
    legacyCoveragePriceKeyAliases[value as LegacyCoveragePriceKey] ?? null
  );
}

export function getCoveragePriceKey({
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
}): CoveragePriceKey {
  const normalizedPlan = plan.toLowerCase();

  if (normalizedPlan === "foundation" || normalizedPlan === "starter") {
    return hipaaEnabled ? "starterHipaa" : "starter";
  }

  const normalizedEmployeeCount = Math.max(26, employeeCount ?? 26);

  if (normalizedEmployeeCount <= 50) {
    return hipaaEnabled ? "operational26To50Hipaa" : "operational26To50";
  }

  if (normalizedEmployeeCount <= 100) {
    return hipaaEnabled ? "operational51To100Hipaa" : "operational51To100";
  }

  return hipaaEnabled ? "operational101To250Hipaa" : "operational101To250";
}

export function formatPaladinPrice(
  item: Pick<PaladinPriceItem, "amountCents" | "interval">
) {
  const amount = new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: item.amountCents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(item.amountCents / 100);

  return item.interval ? `${amount} / ${item.interval}` : amount;
}

export function getPaladinPlanName(item: PaladinPriceItem) {
  if (item.plan === "starter") {
    return item.hipaa ? "Starter + Optional HIPAA Add-On" : "Starter";
  }

  if (item.plan === "operational") {
    return formatOperationalPlanLabel(item.hipaa);
  }

  return item.displayName;
}

export function normalizePaladinPlanName(planName: string | null | undefined) {
  if (!planName) {
    return "";
  }

  const normalizedPlanName = planName.toLowerCase();
  const includesHipaa = normalizedPlanName.includes("hipaa");

  if (
    normalizedPlanName.includes("foundation") ||
    normalizedPlanName.includes("starter") ||
    normalizedPlanName.includes("paladin foundation")
  ) {
    return includesHipaa ? "Starter + Optional HIPAA Add-On" : "Starter";
  }

  if (
    normalizedPlanName.includes("growth") ||
    normalizedPlanName.includes("operational")
  ) {
    return formatOperationalPlanLabel(includesHipaa);
  }

  return planName;
}

export function getPaladinBillingInterval(item: PaladinPriceItem) {
  return item.interval ?? "one_time";
}

export function requiresActiveCoverage(item: PaladinPriceItem) {
  return item.visibility === "active_coverage";
}

function formatOperationalPlanLabel(includesHipaa: boolean) {
  const baseLabel = "Operational";

  return includesHipaa ? `${baseLabel} + Optional HIPAA Add-On` : baseLabel;
}
