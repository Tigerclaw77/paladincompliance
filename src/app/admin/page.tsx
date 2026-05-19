import Link from "next/link";
import {
  getAdminDashboardOverview,
  type AdminActivity,
  type AdminOrganizationRow,
} from "@/lib/paladin/admin/queries";
import EmptyState from "@/components/ui/EmptyState";
import { formatDisplayDate, getStatusLabel } from "@/lib/paladin/verification";

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const overview = await getAdminDashboardOverview(query);

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Internal Operations
        </p>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Internal operations overview
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
              Support visibility for organizations, coverage state,
              verification records, assets, and coverage activity.
            </p>
          </div>
          <Link
            className="inline-flex justify-center rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-3 text-sm font-black text-blue-100 transition hover:bg-blue-400/15"
            href="/admin/organizations"
          >
            View All Organizations
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Organizations" value={overview.organizationCount} />
        <AdminMetric
          label="Active Coverage"
          value={overview.activeSubscriptions}
        />
        <AdminMetric label="HIPAA Requested" value={overview.hipaaCount} />
        <AdminMetric
          label="Recent Activity"
          value={overview.recentActivity.length}
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
              Organization Search
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Organization records
            </h2>
          </div>
          <OrganizationSearchForm query={query} />
        </div>
        <OrganizationTable organizations={overview.organizations} />
      </section>

      <ActivityFeed activity={overview.recentActivity} />
    </div>
  );
}

function OrganizationSearchForm({ query }: { query: string }) {
  return (
    <form className="flex flex-col gap-3 sm:flex-row" method="get">
      <input
        className="h-12 min-w-0 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 sm:w-80"
        defaultValue={query}
        name="q"
        placeholder="Search name, slug, or member email"
      />
      <button
        className="h-12 rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] transition hover:from-blue-600 hover:to-blue-400"
        type="submit"
      >
        Search
      </button>
    </form>
  );
}

function OrganizationTable({
  organizations,
}: {
  organizations: AdminOrganizationRow[];
}) {
  return (
    <div className="mt-6 grid gap-3">
      {organizations.length > 0 ? (
        organizations.map((organization) => (
          <Link
            className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-blue-300/30 hover:bg-blue-300/[0.06]"
            href={`/admin/organizations/${organization.id}`}
            key={organization.id}
          >
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-white">
                    {organization.name}
                  </h3>
                  <StatusPill value={organization.subscriptionStatus} />
                  {organization.hipaaEnabled && (
                    <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-100">
                      HIPAA
                    </span>
                  )}
                </div>
                <p className="mt-2 break-all font-mono text-xs text-blue-100">
                  /verify/{organization.slug}
                </p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-3">
                <MiniDetail label="Plan" value={organization.planLabel} />
                <MiniDetail
                  label="Verification"
                  value={getStatusLabel(organization.verificationStatus)}
                />
                <MiniDetail
                  label="Binder"
                  value={formatDisplayDate(organization.latestBinder?.createdAt)}
                />
              </dl>
            </div>
          </Link>
        ))
      ) : (
        <EmptyState
          message="Try a different organization name, slug, or member email."
          title="No organizations found"
        />
      )}
    </div>
  );
}

function ActivityFeed({ activity }: { activity: AdminActivity[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
        Recent Activity
      </p>
      <div className="mt-5 grid gap-3">
        {activity.length > 0 ? (
          activity.map((item) => (
            <Link
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-blue-300/30 hover:bg-blue-300/[0.06]"
              href={item.href}
              key={item.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.organizationName}: {item.description}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {formatDisplayDate(item.occurredAt)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            message="Binder, asset, and coverage events will appear here as organizations use the platform."
            title="No activity yet"
          />
        )}
      </div>
    </section>
  );
}

function AdminMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/90 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-black text-slate-100">{value}</dd>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const isActive = value === "active" || value === "trialing";
  const isWarning = value === "past_due" || value === "unpaid";

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
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
