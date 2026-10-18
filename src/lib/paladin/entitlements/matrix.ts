export type PaladinPlan = "STARTER" | "GROWTH" | "ENTERPRISE";

export type EntitlementFeature =
  | "binderPdfGeneration"
  | "downloadableAssets"
  | "hipaaAddOn"
  | "trainingCertificates"
  | "trainingModules"
  | "verificationModules";

export type EntitlementFeatureConfig = {
  label: string;
  minimumPlan: PaladinPlan;
  upgradePlan?: PaladinPlan;
};

export const planRank: Record<PaladinPlan, number> = {
  STARTER: 1,
  GROWTH: 2,
  ENTERPRISE: 3,
};

export const entitlementMatrix: Record<
  EntitlementFeature,
  EntitlementFeatureConfig
> = {
  binderPdfGeneration: {
    label: "Binder PDF generation",
    minimumPlan: "STARTER",
  },
  downloadableAssets: {
    label: "Downloadable assets",
    minimumPlan: "STARTER",
  },
  hipaaAddOn: {
    label: "HIPAA add-on",
    minimumPlan: "STARTER",
  },
  trainingCertificates: {
    label: "Training attestations",
    minimumPlan: "GROWTH",
    upgradePlan: "GROWTH",
  },
  trainingModules: {
    label: "Training modules",
    minimumPlan: "GROWTH",
    upgradePlan: "GROWTH",
  },
  verificationModules: {
    label: "Registry record modules",
    minimumPlan: "STARTER",
  },
};

export function planIncludesFeature(
  plan: PaladinPlan,
  feature: EntitlementFeature
) {
  return planRank[plan] >= planRank[entitlementMatrix[feature].minimumPlan];
}

export function getPlanLabel(plan: PaladinPlan) {
  if (plan === "ENTERPRISE") {
    return "Enterprise";
  }

  if (plan === "GROWTH") {
    return "Operational";
  }

  return "Starter";
}

export function isStarterPlan(plan: PaladinPlan) {
  return plan === "STARTER";
}

export function isOperationalPlan(plan: PaladinPlan) {
  return plan === "GROWTH";
}

export function isEnterprisePlan(plan: PaladinPlan) {
  return plan === "ENTERPRISE";
}
