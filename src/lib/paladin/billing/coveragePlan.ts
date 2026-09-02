import "server-only";

import type { AcquisitionIntent, Subscription } from "@prisma/client";
import {
  getCoveragePriceKey,
  getPaladinPlanName,
  getPaladinPriceItem,
  normalizePaladinPlanName,
} from "@/lib/paladin/pricing";
import {
  getCatalogPlanName,
  getStripeCatalogItemByPriceId,
} from "@/lib/stripe/catalog";
import { isSubscriptionVerificationActive } from "@/lib/stripe/subscriptions";

type CoveragePlanIntent = Pick<
  AcquisitionIntent,
  "employeeCount" | "hipaaEnabled" | "plan"
>;

type CoveragePlanSubscription = Pick<
  Subscription,
  "planName" | "status" | "stripePriceId"
>;

export type CoveragePlanSnapshot = {
  label: string;
  source: "active_subscription" | "none" | "pending_intent";
};

export function resolveCoveragePlanSnapshot({
  acquisitionIntent,
  subscription,
}: {
  acquisitionIntent?: CoveragePlanIntent | null;
  subscription?: CoveragePlanSubscription | null;
}): CoveragePlanSnapshot {
  const currentSubscription = subscription ?? null;

  if (isSubscriptionVerificationActive(currentSubscription?.status)) {
    return {
      label: getSubscriptionPlanLabel(currentSubscription),
      source: "active_subscription",
    };
  }

  if (acquisitionIntent) {
    return {
      label: getAcquisitionIntentPlanLabel(acquisitionIntent),
      source: "pending_intent",
    };
  }

  return {
    label: "Coverage not selected",
    source: "none",
  };
}

export function getAcquisitionIntentPlanLabel(
  acquisitionIntent: CoveragePlanIntent
) {
  if (acquisitionIntent.plan === "ENTERPRISE") {
    return "Custom Enterprise Coverage";
  }

  return getPaladinPlanName(
    getPaladinPriceItem(
      getCoveragePriceKey({
        employeeCount: acquisitionIntent.employeeCount,
        hipaaEnabled: acquisitionIntent.hipaaEnabled,
        plan: acquisitionIntent.plan,
      })
    )
  );
}

function getSubscriptionPlanLabel(subscription: CoveragePlanSubscription | null) {
  const catalogItem = getStripeCatalogItemByPriceId(
    subscription?.stripePriceId
  );

  if (catalogItem?.family === "coverage") {
    return getCatalogPlanName(catalogItem);
  }

  return normalizePaladinPlanName(subscription?.planName) || "Active Coverage";
}
