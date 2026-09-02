import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  adminRefreshVerificationAssets,
  adminRegenerateBinder,
  adminSetVerificationStatus,
} from "@/lib/paladin/admin/operations";
import { AssetStorageError } from "@/lib/paladin/assets";
import EmptyState from "@/components/ui/EmptyState";
import { getAdminOrganizationDetail } from "@/lib/paladin/admin/queries";
import { formatDisplayDate, getStatusLabel } from "@/lib/paladin/verification";

type AdminOrganizationDetailPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
  searchParams: Promise<{
    updated?: string;
  }>;
};

export default async function AdminOrganizationDetailPage({
  params,
  searchParams,
}: AdminOrganizationDetailPageProps) {
  const { organizationId } = await params;
  const query = await searchParams;
  const detail = await getAdminOrganizationDetail(organizationId);

  if (!detail) {
    notFound();
  }

  const { entitlements, organization, verificationUrl } = detail;
  const verificationSlug = organization.verificationPage?.slug ?? organization.slug;

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <Link
          className="text-sm font-bold text-blue-200 transition hover:text-blue-100"
          href="/admin/organizations"
        >
          Back to Organizations
        </Link>
        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
              Organization Detail
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {organization.name}
            </h1>
            <p className="mt-4 break-all font-mono text-xs leading-5 text-blue-100">
              {verificationUrl}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill value={organization.subscription?.status ?? "inactive"} />
            <StatusPill value={organization.verificationPage?.status ?? "draft"} />
            {organization.acquisitionIntent?.hipaaEnabled && (
              <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-100">
                HIPAA Requested
              </span>
            )}
          </div>
        </div>
      </header>

      {query.updated && (
        <section className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm font-semibold leading-6 text-emerald-100">
          {getUpdatedMessage(query.updated)}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminDetailCard label="Plan" value={entitlements.planLabel} />
        <AdminDetailCard
          label="Coverage"
          value={getStatusLabel(organization.subscription?.status)}
        />
        <AdminDetailCard
          label="Verification"
          value={getStatusLabel(organization.verificationPage?.status)}
        />
        <AdminDetailCard
          label="HIPAA"
          value={organization.acquisitionIntent?.hipaaEnabled ? "Requested" : "No"}
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Operational Controls
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            Controlled administrative actions
          </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminActionForm
            action={markVerificationActive}
            label="Mark Verification Active"
            organizationId={organization.id}
          />
          <AdminActionForm
            action={markVerificationInactive}
            label="Mark Verification Inactive"
            organizationId={organization.id}
            variant="muted"
          />
          <AdminActionForm
            action={refreshVerificationAssets}
            label="Refresh QR Assets"
            organizationId={organization.id}
            variant="muted"
          />
          <AdminActionForm
            action={regenerateBinder}
            label="Regenerate Binder"
            organizationId={organization.id}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Organization Metadata
          </p>
          <dl className="mt-5 grid gap-4">
            <DetailRow label="ID" value={organization.id} />
            <DetailRow label="Slug" value={organization.slug} />
            <DetailRow label="Verification Slug" value={verificationSlug} />
            <DetailRow
              label="Created"
              value={formatDisplayDate(organization.createdAt)}
            />
            <DetailRow
              label="Updated"
              value={formatDisplayDate(organization.updatedAt)}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Billing Snapshot
          </p>
          <dl className="mt-5 grid gap-4">
            <DetailRow
              label="Stripe Customer"
              value={organization.subscription?.stripeCustomerId ?? "Not recorded"}
            />
            <DetailRow
              label="Stripe Subscription"
              value={
                organization.subscription?.stripeSubscriptionId ?? "Not recorded"
              }
            />
            <DetailRow
              label="Stripe Price"
              value={organization.subscription?.stripePriceId ?? "Pending"}
            />
            <DetailRow
              label="Renewal"
              value={formatDisplayDate(
                organization.subscription?.currentPeriodEnd
              )}
            />
          </dl>
        </section>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
          Members
        </p>
        <div className="mt-5 grid gap-3">
          {organization.memberships.map((membership) => (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
              key={membership.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-white">
                    {membership.user.email}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {membership.user.name ?? "No display name"}
                  </p>
                </div>
                <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-blue-100">
                  {membership.role.toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6">
        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Downloadable Assets
          </p>
          <div className="mt-5 grid gap-3">
            {organization.downloadableAssets.length > 0 ? (
              organization.downloadableAssets.map((asset) => (
                <div
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  key={asset.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-white">{asset.title}</p>
                    <span className="rounded-full border border-slate-400/20 bg-slate-400/10 px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                      {asset.assetType}
                    </span>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-slate-400">
                    {asset.filename}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {formatDisplayDate(asset.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                message="Verification assets will appear here once organizational coverage becomes active."
                title="Verification assets pending"
              />
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

type AdminAction = (formData: FormData) => Promise<void>;

function AdminActionForm({
  action,
  label,
  organizationId,
  variant = "primary",
}: {
  action: AdminAction;
  label: string;
  organizationId: string;
  variant?: "muted" | "primary";
}) {
  return (
    <form action={action}>
      <input name="organizationId" type="hidden" value={organizationId} />
      <button
        className={`h-12 w-full rounded-lg border px-4 text-sm font-black transition ${
          variant === "primary"
            ? "border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] hover:from-blue-600 hover:to-blue-400"
            : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
        }`}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}

async function markVerificationActive(formData: FormData) {
  "use server";

  const organizationId = getOrganizationId(formData);
  const result = await adminSetVerificationStatus({
    organizationId,
    status: "verified",
  });

  if (!result) {
    redirect("/admin/organizations?updated=not-found");
  }

  redirect(`/admin/organizations/${organizationId}?updated=verification-active`);
}

async function markVerificationInactive(formData: FormData) {
  "use server";

  const organizationId = getOrganizationId(formData);
  const result = await adminSetVerificationStatus({
    organizationId,
    status: "inactive",
  });

  if (!result) {
    redirect("/admin/organizations?updated=not-found");
  }

  redirect(`/admin/organizations/${organizationId}?updated=verification-inactive`);
}

async function refreshVerificationAssets(formData: FormData) {
  "use server";

  const organizationId = getOrganizationId(formData);
  let result: Awaited<ReturnType<typeof adminRefreshVerificationAssets>>;

  try {
    result = await adminRefreshVerificationAssets(organizationId);
  } catch (error) {
    if (error instanceof AssetStorageError) {
      redirect(`/admin/organizations/${organizationId}?updated=storage-error`);
    }

    throw error;
  }

  if (!result) {
    redirect("/admin/organizations?updated=not-found");
  }

  redirect(`/admin/organizations/${organizationId}?updated=assets`);
}

async function regenerateBinder(formData: FormData) {
  "use server";

  const organizationId = getOrganizationId(formData);
  let result: Awaited<ReturnType<typeof adminRegenerateBinder>>;

  try {
    result = await adminRegenerateBinder(organizationId);
  } catch (error) {
    if (error instanceof AssetStorageError) {
      redirect(`/admin/organizations/${organizationId}?updated=storage-error`);
    }

    throw error;
  }

  if (!result) {
    redirect("/admin/organizations?updated=not-found");
  }

  redirect(`/admin/organizations/${organizationId}?updated=binder`);
}

function AdminDetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/90 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-xl font-black capitalize text-white">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-all rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-slate-200">
        {value}
      </dd>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.trim().toLowerCase();
  const isActive = normalized === "active" || normalized === "verified";
  const isWarning =
    normalized === "past_due" ||
    normalized === "pending_renewal" ||
    normalized === "unpaid";

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${
        isActive
          ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
          : isWarning
            ? "border-amber-200/30 bg-amber-200/10 text-amber-100"
            : "border-slate-400/25 bg-slate-400/10 text-slate-300"
      }`}
    >
      {getStatusLabel(value)}
    </span>
  );
}

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getOrganizationId(formData: FormData) {
  const organizationId = getString(formData, "organizationId");

  if (!organizationId) {
    redirect("/admin/organizations?updated=invalid");
  }

  return organizationId;
}

function getUpdatedMessage(updated: string) {
  if (updated === "verification-active") {
    return "Verification status marked active.";
  }

  if (updated === "verification-inactive") {
    return "Verification status marked inactive.";
  }

  if (updated === "assets") {
    return "Verification assets refreshed.";
  }

  if (updated === "binder") {
    return "Binder PDF regenerated and stored.";
  }

  if (updated === "storage-error") {
    return "Asset storage is not currently available. No asset was created.";
  }

  return "Organization updated.";
}
