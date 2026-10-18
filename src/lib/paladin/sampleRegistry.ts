import {
  getActiveModules,
  resolveVerificationLifecycle,
} from "@/lib/paladin/verification";

// FICTITIOUS demonstration data. "Example Organization (Sample)" is not a real
// customer. Dates are fixed so the sample never drifts into a "lapsed" state.
export const SAMPLE_ORGANIZATION_NAME = "Example Organization (Sample)";
export const SAMPLE_ORGANIZATION_SLUG = "sample-example-organization";
export const SAMPLE_VERIFICATION_ID = "PLD-SAMPLE-000000";
export const SAMPLE_REVISION_ID = "PV-20260601-R1";
export const SAMPLE_ISSUE_DATE = new Date("2026-06-01T12:00:00Z");
export const SAMPLE_ACTIVE_THROUGH = new Date("2027-06-01T12:00:00Z");
export const SAMPLE_REGISTRY_PATH = "/sample/registry";

export function getSampleRegistryProps(siteUrl: string) {
  const now = new Date("2026-09-01T12:00:00Z");
  const lifecycle = resolveVerificationLifecycle({
    currentPeriodEnd: SAMPLE_ACTIVE_THROUGH,
    now,
    subscriptionStatus: "active",
    verificationStatus: "published",
  });
  const activeModules = getActiveModules(
    "published",
    { status: "active" },
    [],
    {
      features: {
        downloadableAssets: { allowed: true },
        hipaaAddOn: { allowed: false },
        verificationModules: { allowed: true },
      },
    }
  );

  return {
    activeModules,
    activeThroughDate: SAMPLE_ACTIVE_THROUGH,
    issueDate: SAMPLE_ISSUE_DATE,
    lifecycle,
    organizationName: SAMPLE_ORGANIZATION_NAME,
    organizationSlug: SAMPLE_ORGANIZATION_SLUG,
    planLabel: "Starter (sample)",
    planStatusLabel: "Active (sample)",
    revisionId: SAMPLE_REVISION_ID,
    sample: true,
    verificationId: SAMPLE_VERIFICATION_ID,
    verificationUrl: `${siteUrl}${SAMPLE_REGISTRY_PATH}`,
  };
}
