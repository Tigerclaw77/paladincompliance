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
        "Verification coverage is no longer active and requires renewal before the record should be treated as active.",
      state: "lapsed",
      tone: "inactive",
    };
  }

  if (isRenewalDue) {
    return {
      badgeLabel: "RENEWAL DUE",
      description:
        "Verification remains visible while renewal timing or billing status requires review.",
      state: "renewal_due",
      tone: "warning",
    };
  }

  if (isNeverActivated) {
    return {
      badgeLabel: "NOT YET ACTIVE",
      description:
        "Verification is prepared but not yet active. Coverage must be activated before this record should be presented as active.",
      state: "not_yet_active",
      tone: "draft",
    };
  }

  if (isActiveSubscription && !isExplicitlyInactiveVerification) {
    return {
      badgeLabel: "ACTIVE",
      description:
        "Verification is active and available for public stakeholder review.",
      state: "active",
      tone: "active",
    };
  }

  return {
    badgeLabel: "LAPSED",
    description:
      "Verification coverage was previously active but is not currently maintained as active.",
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
  const moduleMap = new Map<string, ModuleBadge>();
  const baseModules: ModuleBadge[] = [
    {
      description: verificationAllowed
        ? "Public record for stakeholder review and verification continuity."
        : "Archived public record retained while coverage is inactive.",
      label: "Public Verification",
      tone,
    },
    {
      description: "Documented AI use expectations and review controls.",
      label: "AI Usage Policy",
      tone,
    },
    {
      description: "Printable governance binder and supporting compliance artifacts.",
      label: "Binder Readiness",
      tone: downloadsAllowed
        ? assets.length > 0
          ? "active"
          : "draft"
        : "inactive",
    },
    {
      description: "Coverage state reflected from billing records.",
      label: "Coverage Status",
      tone: subscription ? subscriptionTone : "draft",
    },
  ];

  baseModules.forEach((module) => moduleMap.set(module.label, module));

  if (hipaaAllowed) {
    moduleMap.set("HIPAA Module Active", {
      description:
        "HIPAA module coverage and public verification labeling are active.",
      label: "HIPAA Module Active",
      tone: "active",
    });
  } else if (hipaaRequested) {
    moduleMap.set("HIPAA Coverage Pending", {
      description:
        "HIPAA module request is recorded and will display when coverage is active.",
      label: "HIPAA Coverage Pending",
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
