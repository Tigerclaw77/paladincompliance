import Link from "next/link";
import ManageBillingButton from "@/components/billing/ManageBillingButton";
import DownloadableAssetsSection from "@/components/dashboard/DownloadableAssetsSection";
import OrganizationStatusCards from "@/components/dashboard/OrganizationStatusCards";
import VerificationUrlPreview from "@/components/dashboard/VerificationUrlPreview";
import SubscriptionEntitlementBadge from "@/components/entitlements/SubscriptionEntitlementBadge";
import ModuleBadge from "@/components/verification/ModuleBadge";
import VerificationQrCard from "@/components/verification/VerificationQrCard";
import {
  formatDisplayDate,
  formatLifecycleDate,
  getActiveModules,
  getStatusLabel,
  getVerificationId,
  getVerificationRevisionId,
  resolveVerificationLifecycle,
  type VerificationLifecycle,
} from "@/lib/paladin/verification";
import { resolveCoveragePlanSnapshot } from "@/lib/paladin/billing/coveragePlan";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import {
  canAccessFeature,
  resolveOrganizationEntitlements,
} from "@/lib/paladin/entitlements/service";
import {
  getAbsoluteVerificationUrl,
  getDisplayVerificationUrl,
} from "@/lib/paladin/siteUrl";

export default async function DashboardPage() {
  const { organization } = await getCurrentOrganization();
  const subscription = organization.subscription;
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription,
  });
  const planSnapshot = resolveCoveragePlanSnapshot({
    acquisitionIntent: organization.acquisitionIntent,
    subscription,
  });
  const verificationPage = organization.verificationPage;
  const verificationSlug = verificationPage?.slug ?? organization.slug;
  const verificationUrl = getAbsoluteVerificationUrl(verificationSlug);
  const displayVerificationUrl = getDisplayVerificationUrl(verificationSlug);
  const lifecycle = resolveVerificationLifecycle({
    currentPeriodEnd: subscription?.currentPeriodEnd,
    subscriptionStatus: subscription?.status,
    verificationStatus: verificationPage?.status,
  });
  const verificationId = verificationPage
    ? getVerificationId({
        organizationId: organization.id,
        verificationPageId: verificationPage.id,
      })
    : "Pending";
  const revisionId = getVerificationRevisionId(verificationPage?.updatedAt);
  const issueDate = verificationPage?.publishedAt ?? verificationPage?.createdAt;
  const activeThroughDate = subscription?.currentPeriodEnd;
  const certificateHref = verificationPage
    ? `/api/verification-certificate/${verificationSlug}`
    : "";
  const activeModules = getActiveModules(
    verificationPage?.status,
    subscription,
    organization.downloadableAssets,
    entitlements
  );
  const downloadsEnabled = canAccessFeature(entitlements, "downloadableAssets");
  const hasStripeCustomer = Boolean(subscription?.stripeCustomerId);

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Organization Overview
        </p>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              {organization.name}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
              Maintain public verification, renewal status, binder records, and
              organization identity from a restrained administrative workspace.
            </p>
          </div>
          <div className="grid gap-3 sm:justify-items-end">
            <SubscriptionEntitlementBadge entitlements={entitlements} />
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Established
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {formatDisplayDate(organization.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <OrganizationStatusCards
        assetCount={organization.downloadableAssets.length}
        activeThroughDate={activeThroughDate}
        lifecycle={lifecycle}
        subscriptionStatus={subscription?.status}
        verificationStatus={verificationPage?.status}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Subscription & Verification
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Coverage record and renewal state
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Administrative view of the subscription, public verification,
                and controlled records used across certificates, QR assets, and
                physical binder references.
              </p>
            </div>
            <LifecyclePill lifecycle={lifecycle} />
          </div>

          <dl className="mt-6 grid gap-3 md:grid-cols-2">
            <OperationsDatum
              label="Current Plan"
              value={planSnapshot.label}
            />
            <OperationsDatum
              label="Subscription Status"
              value={getStatusLabel(subscription?.status)}
            />
            <OperationsDatum
              label="Coverage Active Through"
              value={formatLifecycleDate(activeThroughDate)}
            />
            <OperationsDatum
              label="Verification Lifecycle"
              value={lifecycle.badgeLabel}
            />
            <OperationsDatum
              label="HIPAA Add-On"
              value={entitlements.features.hipaaAddOn.allowed ? "ACTIVE" : "INACTIVE"}
            />
            <OperationsDatum
              label="Current Verification URL"
              value={displayVerificationUrl}
            />
            <OperationsDatum
              label="Verification ID"
              value={verificationId}
            />
            <OperationsDatum label="Revision ID" value={revisionId} />
            <OperationsDatum
              label="Issue Date"
              value={formatLifecycleDate(issueDate)}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Administrative Actions
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            Verification assets
          </h2>
          <div className="mt-5 grid gap-3">
            <AdminAction
              href={`/verify/${verificationSlug}`}
              label="Preview Public Page"
              tone="primary"
            />
            <AdminAction
              href="/whats-included"
              label="What's Included / About the Binder"
            />
            <AdminAction
              disabled={!certificateHref}
              href={certificateHref || "#"}
              label="Download Verification Certificate"
            />
            <AdminAction
              disabled={!downloadsEnabled}
              href={`/api/verification-qr/${verificationSlug}`}
              label="Download QR Asset"
              description={
                downloadsEnabled
                  ? undefined
                  : "Assets become available after verification activation."
              }
            />
            <ManageBillingButton
              disabled={!hasStripeCustomer}
              disabledReason="Billing portal access appears after Stripe creates the customer record."
            />
            <AdminAction href="/dashboard/assets" label="Open Binder Assets" />
            <AdminAction href="/dashboard/settings" label="Edit Organization Metadata" />
            <AdminAction
              description={
                entitlements.hasActiveSubscription
                  ? undefined
                  : "Available after organizational coverage is active."
              }
              disabled={!entitlements.hasActiveSubscription}
              href="/dashboard/assets#additional-binders"
              label="Order Additional Binder"
            />
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Public Module Signals
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            Current verification modules
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {activeModules.map((module) => (
              <ModuleBadge key={module.label} module={module} />
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <VerificationUrlPreview slug={verificationSlug} />
          <VerificationQrCard
            displayVerificationUrl={displayVerificationUrl}
            downloadHref={`/api/verification-qr/${verificationSlug}`}
            organizationName={organization.name}
            showDownload={downloadsEnabled}
            verificationUrl={verificationUrl}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">
            Coverage State
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            Account status and coverage boundary
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Billing status and renewal timing control whether public
            verification is not yet active, active, renewal due, or lapsed.
          </p>
          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Public Verification State
            </p>
            <p className="mt-2 text-xl font-black capitalize text-white">
              {lifecycle.badgeLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {lifecycle.description}
            </p>
          </div>
        </section>

        <DownloadableAssetsSection
          assets={organization.downloadableAssets}
          downloadsEnabled={downloadsEnabled}
          manageHref="/dashboard/assets"
        />
      </section>
    </div>
  );
}

function LifecyclePill({ lifecycle }: { lifecycle: VerificationLifecycle }) {
  const className =
    lifecycle.tone === "active"
      ? "border-emerald-300/30 bg-emerald-300/12 text-emerald-100"
      : lifecycle.tone === "warning"
        ? "border-amber-300/35 bg-amber-300/12 text-amber-100"
        : lifecycle.tone === "draft"
          ? "border-blue-300/30 bg-blue-300/12 text-blue-100"
          : "border-slate-400/25 bg-slate-400/10 text-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-current shadow-[0_0_16px_currentColor]" />
      {lifecycle.badgeLabel}
    </span>
  );
}

function OperationsDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <dt className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-words font-mono text-sm font-bold text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function AdminAction({
  description,
  disabled = false,
  href,
  label,
  tone = "secondary",
}: {
  description?: string;
  disabled?: boolean;
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}) {
  if (disabled) {
    return (
      <span className="rounded-lg border border-slate-400/20 bg-slate-400/10 px-4 py-3 text-sm font-black text-slate-400">
        {label}
        {description && (
          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
            {description}
          </span>
        )}
      </span>
    );
  }

  const className =
    tone === "primary"
      ? "border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
      : "border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]";

  return (
    <Link
      className={`rounded-lg border px-4 py-3 text-sm font-black transition ${className}`}
      href={href}
    >
      {label}
      {description && (
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-400">
          {description}
        </span>
      )}
    </Link>
  );
}
