import { redirect } from "next/navigation";
import Link from "next/link";
import BinderCheckoutControls from "@/components/billing/BinderCheckoutControls";
import DownloadableAssetsSection from "@/components/dashboard/DownloadableAssetsSection";
import LockedFeature from "@/components/entitlements/LockedFeature";
import SubscriptionEntitlementBadge from "@/components/entitlements/SubscriptionEntitlementBadge";
import {
  AssetStorageError,
  createBinderPdfAsset,
  createVerificationQrPackManifestAsset,
  listOrganizationAssets,
} from "@/lib/paladin/assets";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import { resolveCoveragePlanSnapshot } from "@/lib/paladin/billing/coveragePlan";
import {
  canAccessFeature,
  resolveOrganizationEntitlements,
} from "@/lib/paladin/entitlements/service";
import { getStatusLabel } from "@/lib/paladin/verification";
import {
  additionalBinderPriceKeys,
  formatPaladinPrice,
  getPaladinPriceItem,
} from "@/lib/paladin/pricing";

type AssetsPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
    checkout?: string;
    locked?: string;
  }>;
};

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const { organization } = await getCurrentOrganization();
  const params = await searchParams;
  const assets = await listOrganizationAssets(organization.id);
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });
  const canCreateBinder = canAccessFeature(
    entitlements,
    "binderPdfGeneration"
  );
  const canUseDownloads = canAccessFeature(entitlements, "downloadableAssets");
  const verificationSlug = organization.verificationPage?.slug ?? organization.slug;
  const certificateHref = organization.verificationPage
    ? `/api/verification-certificate/${verificationSlug}`
    : "";

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Assets
        </p>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Downloadable compliance records
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
              Protected files scoped to {organization.name}: the 13-page
              quick-reference record (PDF), registry record downloads, and QR
              assets. The full AI Policy &amp; Evidence Binder is the printed
              copy shipped to you; it is not available as a download here.
            </p>
          </div>
          <div className="grid gap-3">
            <SubscriptionEntitlementBadge entitlements={entitlements} />
            <div className="flex flex-col gap-3 sm:flex-row">
              {canCreateBinder ? (
                <form action={createBinderPdf}>
                  <button
                    className="h-12 rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] transition hover:from-blue-600 hover:to-blue-400"
                    type="submit"
                  >
                    Generate Quick-Reference Record (PDF)
                  </button>
                </form>
              ) : (
                <button
                  className="h-12 cursor-not-allowed rounded-lg border border-slate-400/20 bg-slate-400/10 px-5 text-sm font-black text-slate-300"
                  disabled
                  type="button"
                >
                  Generate Quick-Reference Record (PDF)
                </button>
              )}
              {canUseDownloads && certificateHref ? (
                <Link
                  className="inline-flex h-12 items-center rounded-lg border border-amber-200/25 bg-amber-200/10 px-5 text-sm font-black text-amber-100 transition hover:bg-amber-200/15"
                  href={certificateHref}
                >
                  Registry Record
                </Link>
              ) : (
                <button
                  className="h-12 cursor-not-allowed rounded-lg border border-slate-400/20 bg-slate-400/10 px-5 text-sm font-black text-slate-300"
                  disabled
                  type="button"
                >
                  Registry Record
                </button>
              )}
              {canUseDownloads ? (
                <form action={createQrManifest}>
                  <button
                    className="h-12 rounded-lg border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-slate-200 transition hover:bg-white/[0.08]"
                    type="submit"
                  >
                    Generate QR Manifest
                  </button>
                </form>
              ) : (
                <button
                  className="h-12 cursor-not-allowed rounded-lg border border-slate-400/20 bg-slate-400/10 px-5 text-sm font-black text-slate-300"
                  disabled
                  type="button"
                >
                  Generate QR Manifest
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {params.locked && (
        <section className="rounded-xl border border-amber-200/20 bg-amber-200/[0.08] px-5 py-4 text-sm font-semibold leading-6 text-amber-100">
          {getLockedMessage(params.locked)}
        </section>
      )}

      {params.created && (
        <section className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm font-semibold leading-6 text-emerald-100">
          {getCreatedMessage(params.created)}
        </section>
      )}

      {params.error && (
        <section className="rounded-xl border border-amber-200/20 bg-amber-200/[0.08] px-5 py-4 text-sm font-semibold leading-6 text-amber-100">
          {getErrorMessage(params.error)}
        </section>
      )}

      {params.checkout && (
        <section className="rounded-xl border border-blue-300/20 bg-blue-300/10 px-5 py-4 text-sm font-semibold leading-6 text-blue-100">
          {getCheckoutMessage(params.checkout)}
        </section>
      )}

      {!canCreateBinder && (
        <LockedFeature
          entitlement={entitlements.features.binderPdfGeneration}
          title="Quick-reference record generation becomes available after activation"
        />
      )}

      {!canUseDownloads && (
        <LockedFeature
          entitlement={entitlements.features.downloadableAssets}
          title="Registry record assets become available after activation"
        />
      )}

      {entitlements.hasActiveSubscription && <AdditionalBinderCheckoutSection />}

      <DownloadableAssetsSection
        assets={assets}
        downloadsEnabled={canUseDownloads}
      />
    </div>
  );
}

async function createQrManifest() {
  "use server";

  const { organization } = await getCurrentOrganization();
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });

  if (!canAccessFeature(entitlements, "downloadableAssets")) {
    redirect("/dashboard/assets?locked=assets");
  }

  const verificationSlug = organization.verificationPage?.slug ?? organization.slug;

  try {
    await createVerificationQrPackManifestAsset({
      organizationId: organization.id,
      organizationName: organization.name,
      verificationSlug,
    });
  } catch (error) {
    if (error instanceof AssetStorageError) {
      redirect("/dashboard/assets?error=storage");
    }

    throw error;
  }

  redirect("/dashboard/assets?created=qr-manifest");
}

async function createBinderPdf() {
  "use server";

  const { organization } = await getCurrentOrganization();
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });

  if (!canAccessFeature(entitlements, "binderPdfGeneration")) {
    redirect("/dashboard/assets?locked=binder");
  }

  const verificationSlug = organization.verificationPage?.slug ?? organization.slug;
  const subscriptionTier = resolveCoveragePlanSnapshot({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  }).label;
  const verificationStatus = getStatusLabel(
    organization.verificationPage?.status ?? "draft"
  );

  try {
    await createBinderPdfAsset({
      organizationId: organization.id,
      organizationName: organization.name,
      subscriptionTier,
      verificationSlug,
      verificationStatus,
    });
  } catch (error) {
    if (error instanceof AssetStorageError) {
      redirect("/dashboard/assets?error=storage");
    }

    throw error;
  }

  redirect("/dashboard/assets?created=binder");
}

function getCreatedMessage(created: string) {
  if (created === "binder") {
    return "Quick-reference record (13-page PDF) generated and archived for this organization.";
  }

  return "Verification QR manifest created and archived for this organization.";
}

function getErrorMessage(error: string) {
  if (error === "storage") {
    return "Asset storage is not currently available. No asset was created.";
  }

  return "The asset operation could not be completed.";
}

function getLockedMessage(locked: string) {
  if (locked === "binder") {
    return "Quick-reference record generation becomes available once the registry record is active.";
  }

  return "Registry record assets become available after an active subscription is in place.";
}

function getCheckoutMessage(checkout: string) {
  if (checkout === "binder-success") {
    return "Binder checkout completed. Paladin will use the Stripe record to fulfill the order by mail; no delivery date is guaranteed.";
  }

  if (checkout === "binder-cancel") {
    return "Binder checkout was canceled. No billing record was changed.";
  }

  return "Checkout status updated.";
}

function AdditionalBinderCheckoutSection() {
  return (
    <section
      className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]"
      id="additional-binders"
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          Additional Binder Orders
        </p>
        <h2 className="mt-3 text-2xl font-black text-white">
          Order an additional binder
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Initial physical compliance binders are included with new
          memberships. Additional and replacement binder orders are available
          for covered organizations that need extra printed records for
          locations, vendor packets, or internal files.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {additionalBinderPriceKeys.map((priceKey) => {
          const item = getPaladinPriceItem(priceKey);

          return (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.04] p-5"
              key={priceKey}
            >
              <h3 className="text-lg font-black text-white">
                {item.displayName}
              </h3>
              <p className="mt-2 text-2xl font-black text-amber-100">
                {formatPaladinPrice(item)}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                For organizations with an active Paladin subscription that need an
                additional binder copy.
              </p>
              <div className="mt-5">
                <BinderCheckoutControls
                  variant="dark"
                  label="Purchase Additional Binder"
                  planName={item.displayName}
                  priceKey={priceKey}
                  unitAmountCents={item.amountCents}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
