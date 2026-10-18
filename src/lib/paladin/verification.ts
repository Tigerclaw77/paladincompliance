import type { DownloadableAsset, Subscription } from "@prisma/client";

export type StatusTone = "active" | "draft" | "warning" | "inactive";
export type VerificationLifecycleState =
  | "active"
  | "lapsed"
  | "not_yet_active"
  | "renewal_due";

export type VerificationLifecycleInput = {
  currentPeriodEnd?: Date | null;
  now?: Date;
  subscriptionStatus?: string | null;
  verificationStatus?: string | null;
};

export type VerificationLifecycle = {
  badgeLabel: "ACTIVE" | "LAPSED" | "NOT YET ACTIVE" | "RENEWAL DUE";
  description: string;
  state: VerificationLifecycleState;
  tone: StatusTone;
};

export type ModuleBadge = {
  description: string;
  label: string;
  stateLabel?: string;
  tone: StatusTone;
};

type VerificationEntitlementSnapshot = {
  features?: {
    downloadableAssets?: { allowed: boolean };
    hipaaAddOn?: { allowed: boolean };
    verificationModules?: { allowed: boolean };
  };
  hipaaRequested?: boolean;
};

export function getStatusTone(status: string | null | undefined): StatusTone {
  const normalizedStatus = normalizeStatus(status);

  if (["active", "trialing", "verified", "published"].includes(normalizedStatus)) {
    return "active";
  }

  if (["draft", "pending", "reserved"].includes(normalizedStatus)) {
    return "draft";
  }

  if (["expired", "past_due", "pending_renewal", "unpaid"].includes(normalizedStatus)) {
    return "warning";
  }

  return "inactive";
}

export function resolveVerificationLifecycle({
  currentPeriodEnd,
  now = new Date(),
  subscriptionStatus,
  verificationStatus,
}: VerificationLifecycleInput): VerificationLifecycle {
  const normalizedSubscriptionStatus = normalizeStatus(subscriptionStatus);
  const normalizedVerificationStatus = normalizeStatus(verificationStatus);
  const renewalDueCutoff = addDays(now, 30);
  const isRenewalWindow =
    Boolean(currentPeriodEnd) &&
    currentPeriodEnd! >= now &&
    currentPeriodEnd! <= renewalDueCutoff;
  const isExpiredByDate =
    Boolean(currentPeriodEnd) && currentPeriodEnd! < now;
  const isActiveSubscription = ["active", "trialing"].includes(
    normalizedSubscriptionStatus
  );
  const isExplicitlyInactiveVerification = [
    "canceled",
    "cancelled",
    "expired",
    "inactive",
    "lapsed",
  ].includes(normalizedVerificationStatus);
  const isSetupSubscriptionStatus = [
    "",
    "inactive",
    "incomplete",
    "incomplete_expired",
    "pending",
    "pending_checkout",
  ].includes(normalizedSubscriptionStatus);
  const isSetupVerificationStatus = [
    "",
    "draft",
    "inactive",
    "pending",
    "reserved",
  ].includes(normalizedVerificationStatus);
  const isRenewalDue = [
    "past_due",
    "pending_renewal",
    "unpaid",
  ].includes(normalizedSubscriptionStatus) ||
    normalizedVerificationStatus === "pending_renewal" ||
    (isActiveSubscription && isRenewalWindow);
  const isNeverActivated =
    !currentPeriodEnd &&
    !isActiveSubscription &&
    isSetupSubscriptionStatus &&
    isSetupVerificationStatus;

  if (isExpiredByDate) {
    return {
      badgeLabel: "LAPSED",
      description:
        "This registry record is no longer active and requires renewal before it should be treated as current.",
      state: "lapsed",
      tone: "inactive",
    };
  }

  if (isRenewalDue) {
    return {
      badgeLabel: "RENEWAL DUE",
      description:
        "This registry record remains visible while renewal timing or billing status requires review.",
      state: "renewal_due",
      tone: "warning",
    };
  }

  if (isNeverActivated) {
    return {
      badgeLabel: "NOT YET ACTIVE",
      description:
        "This registry record is not yet active. It should not be presented as current until activated.",
      state: "not_yet_active",
      tone: "draft",
    };
  }

  if (isActiveSubscription && !isExplicitlyInactiveVerification) {
    return {
      badgeLabel: "ACTIVE",
      description:
        "This registry record is active and available for public review. It shows a binder was issued to this organization; it is not a certification.",
      state: "active",
      tone: "active",
    };
  }

  return {
    badgeLabel: "LAPSED",
    description:
      "This registry record was previously active but is not currently maintained as active.",
    state: "lapsed",
    tone: "inactive",
  };
}

export function getStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeStatus(status);

  if (!normalizedStatus) {
    return "Not Active";
  }

  return normalizedStatus
    .split(/[_-]/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function getActiveModules(
  status: string | null | undefined,
  subscription: Pick<Subscription, "status"> | null | undefined,
  assets: Pick<DownloadableAsset, "assetType" | "title">[],
  entitlements?: VerificationEntitlementSnapshot
): ModuleBadge[] {
  const verificationAllowed =
    entitlements?.features?.verificationModules?.allowed ?? true;
  const downloadsAllowed =
    entitlements?.features?.downloadableAssets?.allowed ?? true;
  const hipaaAllowed = entitlements?.features?.hipaaAddOn?.allowed ?? false;
  const hipaaRequested = entitlements?.hipaaRequested ?? false;
  const tone = verificationAllowed ? getStatusTone(status) : "inactive";
  const subscriptionTone = getStatusTone(subscription?.status);
  // The binder is a physical item issued with the plan; downloadable assets are
  // optional extras. Previously the tone depended only on downloadable assets,
  // so active organizations showed "Binder Readiness: Preparing".
  const hasActivePlan = ["active", "trialing"].includes(
    normalizeStatus(subscription?.status)
  );
  const binderIssued = downloadsAllowed && (hasActivePlan || assets.length > 0);
  const moduleMap = new Map<string, ModuleBadge>();
  const baseModules: ModuleBadge[] = [
    {
      description: verificationAllowed
        ? "Public registry record showing this binder was issued to this organization."
        : "Archived public registry record retained while the plan is inactive.",
      label: "Public Registry Record",
      tone,
    },
    {
      description: "Documented AI use expectations and review steps included in the binder.",
      label: "AI Usage Policy",
      tone,
    },
    {
      description: hasActivePlan
        ? "AI Policy & Evidence Binder issued with the annual plan."
        : "Binder issuance is recorded here once the plan is active.",
      label: "Binder",
      stateLabel: binderIssued
        ? "Issued"
        : downloadsAllowed
          ? "Not yet issued"
          : "Not active",
      tone: binderIssued ? "active" : downloadsAllowed ? "draft" : "inactive",
    },
    {
      description: "Plan state reflected from billing records.",
      label: "Plan Status",
      tone: subscription ? subscriptionTone : "draft",
    },
  ];

  baseModules.forEach((module) => moduleMap.set(module.label, module));

  if (hipaaAllowed) {
    moduleMap.set("HIPAA Materials Included", {
      description:
        "HIPAA-oriented policy materials are included. This is not a HIPAA certification.",
      label: "HIPAA Materials Included",
      tone: "active",
    });
  } else if (hipaaRequested) {
    moduleMap.set("HIPAA Materials Pending", {
      description:
        "HIPAA materials add-on request is recorded and will display when the plan is active.",
      label: "HIPAA Materials Pending",
      tone: "warning",
    });
  }

  if (downloadsAllowed) {
    assets.forEach((asset) => {
      const label = asset.assetType || asset.title;

      if (!moduleMap.has(label)) {
        moduleMap.set(label, {
          description: asset.title,
          label,
          tone: "active",
        });
      }
    });
  }

  return Array.from(moduleMap.values());
}

export function formatDisplayDate(date: Date | null | undefined) {
  if (!date) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatLifecycleDate(date: Date | null | undefined) {
  if (!date) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export function getVerificationId({
  organizationId,
  verificationPageId,
}: {
  organizationId: string;
  verificationPageId: string;
}) {
  const organizationPart = organizationId.replace(/[^a-z0-9]/gi, "").slice(-6);
  const verificationPart = verificationPageId
    .replace(/[^a-z0-9]/gi, "")
    .slice(-6);

  return `PLD-${organizationPart}-${verificationPart}`.toUpperCase();
}

export function getVerificationRevisionId(updatedAt: Date | null | undefined) {
  const revisionDate = updatedAt ?? new Date(0);
  const year = revisionDate.getUTCFullYear();
  const month = String(revisionDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(revisionDate.getUTCDate()).padStart(2, "0");

  return `PV-${year}${month}${day}-R1`;
}

export function normalizeStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() ?? "";
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}
