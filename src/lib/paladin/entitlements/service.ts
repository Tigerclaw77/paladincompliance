import "server-only";

import type { AcquisitionIntent, Subscription } from "@prisma/client";
import {
  entitlementMatrix,
  getPlanLabel,
  planIncludesFeature,
  type EntitlementFeature,
  type PaladinPlan,
} from "@/lib/paladin/entitlements/matrix";

export type SubscriptionAccessStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "inactive"
  | "past_due"
  | "pending_checkout"
  | "trialing"
  | "unpaid";

export type FeatureEntitlement = {
  allowed: boolean;
  label: string;
  message: string;
  requiredPlan?: PaladinPlan;
  upgradePlan?: PaladinPlan;
};

export type OrganizationEntitlements = {
  features: Record<EntitlementFeature, FeatureEntitlement>;
  hasActiveSubscription: boolean;
  hipaaRequested: boolean;
  plan: PaladinPlan;
  planLabel: string;
  status: SubscriptionAccessStatus;
  statusLabel: string;
};

type EntitlementInput = {
  acquisitionIntent?: Pick<AcquisitionIntent, "hipaaEnabled" | "plan"> | null;
  subscription?: Pick<Subscription, "planName" | "status"> | null;
};

const activeSubscriptionStatuses = new Set<SubscriptionAccessStatus>([
  "active",
  "trialing",
]);

export function resolveOrganizationEntitlements({
  acquisitionIntent,
  subscription,
}: EntitlementInput): OrganizationEntitlements {
  const status = normalizeSubscriptionStatus(subscription?.status);
  const hasActiveSubscription = activeSubscriptionStatuses.has(status);
  const plan = resolvePlan({
    acquisitionIntentPlan: acquisitionIntent?.plan ?? null,
    subscriptionPlanName: hasActiveSubscription
      ? subscription?.planName ?? null
      : null,
  });
  const hipaaRequested = Boolean(acquisitionIntent?.hipaaEnabled);
  const features = Object.fromEntries(
    (Object.keys(entitlementMatrix) as EntitlementFeature[]).map((feature) => [
      feature,
      resolveFeatureEntitlement({
        feature,
        hasActiveSubscription,
        hipaaRequested,
        plan,
        status,
      }),
    ])
  ) as Record<EntitlementFeature, FeatureEntitlement>;

  return {
    features,
    hasActiveSubscription,
    hipaaRequested,
    plan,
    planLabel: getPlanLabel(plan),
    status,
    statusLabel: getSubscriptionStatusLabel(status),
  };
}

export function canAccessFeature(
  entitlements: OrganizationEntitlements,
  feature: EntitlementFeature
) {
  return entitlements.features[feature].allowed;
}

export function normalizeSubscriptionStatus(
  status: string | null | undefined
): SubscriptionAccessStatus {
  const normalizedStatus = status?.trim().toLowerCase();

  if (
    normalizedStatus === "active" ||
    normalizedStatus === "trialing" ||
    normalizedStatus === "incomplete" ||
    normalizedStatus === "incomplete_expired" ||
    normalizedStatus === "past_due" ||
    normalizedStatus === "pending_checkout" ||
    normalizedStatus === "unpaid" ||
    normalizedStatus === "canceled"
  ) {
    return normalizedStatus;
  }

  return "inactive";
}

export function getSubscriptionStatusLabel(status: SubscriptionAccessStatus) {
  if (status === "past_due") {
    return "Past Due";
  }

  if (status === "pending_checkout") {
    return "Pending Checkout";
  }

  if (status === "incomplete_expired") {
    return "Incomplete Expired";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function resolveFeatureEntitlement({
  feature,
  hasActiveSubscription,
  hipaaRequested,
  plan,
  status,
}: {
  feature: EntitlementFeature;
  hasActiveSubscription: boolean;
  hipaaRequested: boolean;
  plan: PaladinPlan;
  status: SubscriptionAccessStatus;
}): FeatureEntitlement {
  const featureConfig = entitlementMatrix[feature];
  const planAllowed = planIncludesFeature(plan, feature);
  const baseEntitlement = {
    label: featureConfig.label,
    requiredPlan: featureConfig.minimumPlan,
    upgradePlan: featureConfig.upgradePlan,
  };

  if (!hasActiveSubscription) {
    return {
      ...baseEntitlement,
      allowed: false,
      message: getInactiveSubscriptionMessage(status),
    };
  }

  if (!planAllowed) {
    return {
      ...baseEntitlement,
      allowed: false,
      message: `${featureConfig.label} is available on ${getPlanLabel(
        featureConfig.minimumPlan
      )} and above.`,
    };
  }

  if (feature === "hipaaAddOn" && !hipaaRequested) {
    return {
      ...baseEntitlement,
      allowed: false,
      message:
        "HIPAA coverage is available as an add-on for organizations that need PHI-focused policy documentation and public verification labeling.",
    };
  }

  return {
    ...baseEntitlement,
    allowed: true,
    message: `${featureConfig.label} is available for this organization.`,
  };
}

function resolvePlan({
  acquisitionIntentPlan,
  subscriptionPlanName,
}: {
  acquisitionIntentPlan: string | null;
  subscriptionPlanName: string | null;
}): PaladinPlan {
  const normalizedPlanName = subscriptionPlanName?.toLowerCase() ?? "";

  if (normalizedPlanName.includes("enterprise")) {
    return "ENTERPRISE";
  }

  if (
    normalizedPlanName.includes("growth") ||
    normalizedPlanName.includes("operational")
  ) {
    return "GROWTH";
  }

  if (
    normalizedPlanName.includes("foundation") ||
    normalizedPlanName.includes("starter")
  ) {
    return "STARTER";
  }

  if (
    acquisitionIntentPlan === "ENTERPRISE" ||
    acquisitionIntentPlan === "GROWTH"
  ) {
    return acquisitionIntentPlan;
  }

  return "STARTER";
}

function getInactiveSubscriptionMessage(status: SubscriptionAccessStatus) {
  if (status === "past_due" || status === "unpaid") {
    return "Coverage needs billing attention before this feature remains available.";
  }

  if (status === "pending_checkout" || status === "incomplete") {
    return "This feature becomes available after checkout completion.";
  }

  if (status === "canceled") {
    return "Coverage must be reactivated before this feature becomes available.";
  }

  return "Coverage activation makes this feature available.";
}
