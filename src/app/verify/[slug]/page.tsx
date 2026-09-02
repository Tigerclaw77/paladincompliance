import type { Metadata } from "next";
import Link from "next/link";
import VerificationQrCard from "@/components/verification/VerificationQrCard";
import {
  formatLifecycleDate,
  getActiveModules,
  getVerificationId,
  getVerificationRevisionId,
  resolveVerificationLifecycle,
  type ModuleBadge,
  type StatusTone,
  type VerificationLifecycle,
} from "@/lib/paladin/verification";
import { resolveCoveragePlanSnapshot } from "@/lib/paladin/billing/coveragePlan";
import { resolveOrganizationEntitlements } from "@/lib/paladin/entitlements/service";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import { normalizeOrganizationSlug } from "@/lib/paladin/slugs";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://www.paladincompliance.com";

type VerifyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: VerifyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeOrganizationSlug(slug);

  if (!normalizedSlug) {
    return {
      title: "Paladin Verification",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const verificationPage = await prisma.verificationPage.findUnique({
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
    where: {
      slug: normalizedSlug,
    },
  });

  const organizationName = verificationPage?.organization.name;
  const title = organizationName
    ? organizationName === "Paladin Compliance"
      ? "Paladin Verification"
      : `${organizationName} Verification`
    : "Paladin Verification";
  const description = organizationName
    ? `Paladin Compliance verification and governance coverage for ${organizationName}.`
    : "Paladin Compliance verification and governance coverage.";
  const verificationUrl = `${SITE_URL}/verify/${encodeURIComponent(
    normalizedSlug
  )}`;

  return {
    title,
    description,
    alternates: verificationPage
      ? {
          canonical: verificationUrl,
        }
      : undefined,
    openGraph: {
      description: organizationName
        ? `Review Paladin Compliance coverage and governance verification for ${organizationName}.`
        : "Review Paladin Compliance coverage and governance verification.",
      title: organizationName
        ? `${organizationName} | Paladin Verification`
        : "Paladin Verification",
      type: "website",
      url: verificationUrl,
    },
    robots: verificationPage
      ? undefined
      : {
          index: false,
          follow: false,
        },
    twitter: {
      title: `${title} | Paladin Compliance`,
      description,
    },
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeOrganizationSlug(slug);

  if (!normalizedSlug) {
    return <VerificationNotFound slug="unknown" />;
  }

  const verificationPage = await prisma.verificationPage.findUnique({
    where: {
      slug: normalizedSlug,
    },
    include: {
      organization: {
        include: {
          downloadableAssets: true,
          acquisitionIntent: true,
          subscription: true,
        },
      },
    },
  });

  if (!verificationPage) {
    return <VerificationNotFound slug={normalizedSlug} />;
  }

  const organization = verificationPage.organization;
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });
  const planSnapshot = resolveCoveragePlanSnapshot({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });
  const publicVerificationStatus = entitlements.hasActiveSubscription
    ? verificationPage.status
    : getInactiveVerificationStatus(entitlements.status);
  const activeModules = getActiveModules(
    publicVerificationStatus,
    organization.subscription,
    organization.downloadableAssets,
    entitlements
  );
  const issueDate = verificationPage.publishedAt ?? verificationPage.createdAt;
  const activeThroughDate = organization.subscription?.currentPeriodEnd;
  const verificationUrl = getAbsoluteVerificationUrl(verificationPage.slug);
  const verificationId = getVerificationId({
    organizationId: organization.id,
    verificationPageId: verificationPage.id,
  });
  const revisionId = getVerificationRevisionId(verificationPage.updatedAt);
  const lifecycle = resolveVerificationLifecycle({
    currentPeriodEnd: activeThroughDate,
    subscriptionStatus: organization.subscription?.status,
    verificationStatus: publicVerificationStatus,
  });
  const isActiveVerification = lifecycle.state === "active";
  const coverageSignalTone = isActiveVerification ? "active" : lifecycle.tone;
  const activeModuleCount = activeModules.filter(
    (module) => module.tone === "active"
  ).length;
  const certificateHref = `/api/verification-certificate/${verificationPage.slug}`;

  return (
    <main className="verification-public-page min-h-[calc(100vh-8rem)] max-w-full overflow-x-hidden bg-slate-950 text-white">
      <section className="relative px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#0f172a_48%,#142448_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent"
        />

        <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-8">
          <section className="print-surface relative w-full min-w-0 overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/86 shadow-[0_32px_110px_rgba(2,6,23,0.56)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(198,168,91,0.12),transparent_30%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent"
            />

            <div className="relative grid min-w-0 gap-10 p-5 sm:p-10 lg:grid-cols-[1fr_330px] lg:p-12">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-amber-200">
                  {isActiveVerification ? "Verified Organization" : "Verification Record"}
                </p>
                <h1 className="mt-6 max-w-[18rem] break-words text-3xl font-black leading-[1.04] text-white sm:max-w-4xl sm:text-5xl lg:text-7xl">
                  {organization.name}
                </h1>
                <div className="mt-7 flex max-w-full flex-wrap items-center gap-3">
                  <StatusPill lifecycle={lifecycle} />
                  <span className="max-w-full break-words rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 sm:text-xs sm:tracking-[0.16em]">
                    {entitlements.statusLabel} Coverage
                  </span>
                  {entitlements.features.hipaaAddOn.allowed && (
                    <span className="max-w-full break-words rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100 sm:text-xs sm:tracking-[0.16em]">
                      HIPAA Add-On Active
                    </span>
                  )}
                  <span className="max-w-full break-all rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-100 sm:text-xs sm:tracking-[0.16em]">
                    ID {verificationId}
                  </span>
                </div>
                <p className="mt-7 max-w-[19rem] text-lg leading-8 text-slate-300 print-muted sm:max-w-3xl">
                  {organization.name} maintains a Paladin verification record
                  for responsible AI use, governance documentation, stakeholder
                  review, and public record confirmation.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 print:hidden">
                  <Link
                    className="rounded-lg border border-amber-200/35 bg-amber-200/12 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-200/18"
                    href={certificateHref}
                  >
                    Download Verification Certificate
                  </Link>
                </div>
              </div>

              <OfficialSeal lifecycle={lifecycle} verificationId={verificationId} />
            </div>

            <div className="relative grid border-t border-white/10 bg-slate-950/22 md:grid-cols-2 xl:grid-cols-3">
              <HeroDatum
                label="Organization"
                value={organization.name}
              />
              <HeroDatum
                label="Verification Status"
                value={lifecycle.badgeLabel}
              />
              <HeroDatum
                label="Issue Date"
                value={formatLifecycleDate(issueDate)}
              />
              <HeroDatum
                label="Valid Through"
                value={formatLifecycleDate(activeThroughDate)}
              />
              <HeroDatum
                label="Revision ID"
                value={revisionId}
              />
              <HeroDatum
                label="Verification ID"
                value={verificationId}
              />
            </div>
          </section>

          {lifecycle.state !== "active" && (
            <StatusNotice
              lifecycle={lifecycle}
              subscriptionStatus={entitlements.statusLabel}
            />
          )}

          <section className="grid gap-8 lg:grid-cols-[1fr_0.84fr]">
            <section className="print-surface rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-9">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">
                    Coverage Overview
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-white">
                    Assurance summary
                  </h2>
                </div>
                <p className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
                  {isActiveVerification
                    ? `${activeModuleCount} active signals`
                    : lifecycle.badgeLabel}
                </p>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                  <TrustSignal
                  detail="A hosted Paladin page is available for customer, vendor, and stakeholder review."
                  label="Public verification"
                  tone={lifecycle.tone}
                />
                <TrustSignal
                  detail="Coverage supports AI governance materials, policy assets, and operational transparency."
                  label="AI governance coverage"
                  tone={coverageSignalTone}
                />
                <TrustSignal
                  detail="Coverage is organized around annual review, renewal, and ongoing maintenance."
                  label="Annual review cadence"
                  tone={coverageSignalTone}
                />
                <TrustSignal
                  detail="Verification is associated with the organization, supporting external procurement review."
                  label="Organization-wide coverage"
                  tone={coverageSignalTone}
                />
                <TrustSignal
                  detail={`${verificationId} is the Paladin verification ID for this public record.`}
                  label="Verification reference"
                  tone="draft"
                />
                <TrustSignal
                  detail={revisionId}
                  label="Current revision"
                  tone="draft"
                />
              </div>
            </section>

            <VerificationQrCard
              className="print-surface"
              organizationName={organization.name}
              variant="public"
              verificationUrl={verificationUrl}
            />
          </section>

          <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="print-surface rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">
                {isActiveVerification ? "Active Coverage" : "Coverage Record"}
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Verification modules
              </h2>
              <div className="mt-7 grid gap-4">
                {activeModules.map((module) => (
                  <PublicModuleBadge key={module.label} module={module} />
                ))}
              </div>
            </section>

            <section className="print-surface rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">
                Assurance Details
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Coverage and verification details
              </h2>
              <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                <RecordDetail label="Verification ID" value={verificationId} />
                <RecordDetail label="Revision ID" value={revisionId} />
                <RecordDetail label="Coverage" value={planSnapshot.label} />
                <RecordDetail
                  label="Verification Status"
                  value={lifecycle.badgeLabel}
                />
                <RecordDetail label="Organization Slug" value={organization.slug} />
                <RecordDetail label="Verified By" value="Paladin Compliance" />
                <RecordDetail
                  label="Issue Date"
                  value={formatLifecycleDate(issueDate)}
                />
                <RecordDetail
                  label="Coverage Active Through"
                  value={formatLifecycleDate(activeThroughDate)}
                />
                <RecordDetail
                  label="Coverage Renewal State"
                  value={entitlements.statusLabel}
                />
              </dl>
            </section>
          </section>

          <section className="print-surface rounded-3xl border border-amber-200/20 bg-amber-200/[0.06] p-7 shadow-[0_24px_80px_rgba(2,6,23,0.30)] sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100">
              Verification Note
            </p>
            <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-300 print-muted">
              Paladin Compliance provides this page so customers, vendors, and
              internal stakeholders can confirm governance coverage directly at
              the source. For printed or forwarded copies, compare the public
              URL, current status, and Paladin reference shown here.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function OfficialSeal({
  lifecycle,
  verificationId,
}: {
  lifecycle: VerificationLifecycle;
  verificationId: string;
}) {
  return (
    <aside className="justify-self-start lg:justify-self-end">
      <div
        className={`w-full max-w-[330px] rounded-3xl border bg-slate-950/55 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(2,6,23,0.36)] ${
          lifecycle.tone === "active"
            ? "border-emerald-300/35"
            : lifecycle.tone === "warning"
              ? "border-amber-200/38"
              : lifecycle.tone === "draft"
                ? "border-blue-300/30"
                : "border-slate-300/22"
        }`}
        aria-label={`Paladin verification badge, ${lifecycle.badgeLabel}`}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-100">
          Paladin Verification
        </p>
        <p className="mt-5 text-3xl font-black text-white">
          {lifecycle.badgeLabel}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300 print-muted">
          {lifecycle.description}
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Verification Reference
          </p>
          <p className="mt-2 font-mono text-sm font-black text-blue-100">
            {verificationId}
          </p>
        </div>
      </div>
    </aside>
  );
}

function StatusPill({ lifecycle }: { lifecycle: VerificationLifecycle }) {
  const toneClasses: Record<StatusTone, string> = {
    active:
      "border-emerald-300/35 bg-emerald-300/12 text-emerald-100 shadow-[0_0_28px_rgba(16,185,129,0.12)]",
    draft: "border-blue-300/30 bg-blue-300/10 text-blue-100",
    inactive: "border-slate-300/25 bg-slate-300/10 text-slate-100",
    warning: "border-amber-200/35 bg-amber-200/12 text-amber-100",
  };

  return (
    <span
      className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em] ${toneClasses[lifecycle.tone]}`}
    >
      {lifecycle.badgeLabel}
    </span>
  );
}

function HeroDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-white/10 px-6 py-5 md:border-r md:last:border-r-0">
      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-black text-white">{value}</dd>
    </div>
  );
}

function StatusNotice({
  lifecycle,
  subscriptionStatus,
}: {
  lifecycle: VerificationLifecycle;
  subscriptionStatus: string;
}) {
  return (
    <section className="print-surface rounded-3xl border border-amber-200/22 bg-amber-200/[0.07] p-7">
      <p className="text-sm font-black text-amber-100">
        {lifecycle.description}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300 print-muted">
        Current coverage is {subscriptionStatus.toLowerCase()}. This page
        remains available for transparency while Paladin verification is
        activated, reviewed, or renewed.
      </p>
    </section>
  );
}

function TrustSignal({
  detail,
  label,
  tone,
}: {
  detail: string;
  label: string;
  tone: StatusTone;
}) {
  const toneClasses: Record<StatusTone, string> = {
    active: "border-emerald-300/18 bg-emerald-300/[0.055]",
    draft: "border-blue-300/18 bg-blue-300/[0.055]",
    inactive: "border-slate-300/14 bg-white/[0.035]",
    warning: "border-amber-200/18 bg-amber-200/[0.055]",
  };
  const dotClasses: Record<StatusTone, string> = {
    active: "bg-emerald-200",
    draft: "bg-blue-200",
    inactive: "bg-slate-300",
    warning: "bg-amber-200",
  };

  return (
    <article className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClasses[tone]}`} />
        <h3 className="text-sm font-black text-white">{label}</h3>
      </div>
      <p className="mt-3 break-words text-sm leading-6 text-slate-300 print-muted">
        {detail}
      </p>
    </article>
  );
}

function PublicModuleBadge({ module }: { module: ModuleBadge }) {
  const toneClasses: Record<StatusTone, string> = {
    active:
      "border-emerald-300/24 bg-gradient-to-r from-emerald-300/[0.08] to-blue-300/[0.055] text-emerald-100",
    draft: "border-blue-300/24 bg-blue-300/[0.06] text-blue-100",
    inactive: "border-slate-300/18 bg-white/[0.035] text-slate-200",
    warning: "border-amber-200/28 bg-amber-200/[0.065] text-amber-100",
  };

  return (
    <article
      className={`rounded-2xl border px-5 py-5 ${toneClasses[module.tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-current">
            {getModuleStateLabel(module.tone)}
          </p>
          <h3 className="mt-2 text-base font-black text-white">
            {module.label}
          </h3>
        </div>
        <span className="rounded-full border border-current/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
          {module.tone === "active" ? "Active" : "Listed"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300 print-muted">
        {module.description}
      </p>
    </article>
  );
}

function RecordDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 py-4 first:border-t-0 sm:first:border-t sm:[&:nth-child(-n+2)]:border-t-0">
      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-words font-mono text-sm font-bold text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function getModuleStateLabel(tone: StatusTone) {
  if (tone === "active") {
    return "Coverage Active";
  }

  if (tone === "warning") {
    return "Review Needed";
  }

  if (tone === "draft") {
    return "Preparing";
  }

  return "Not Active";
}

function getInactiveVerificationStatus(status: string) {
  if (status === "past_due" || status === "unpaid") {
    return "pending_renewal";
  }

  return "inactive";
}

function VerificationNotFound({ slug }: { slug: string }) {
  return (
    <main className="verification-public-page min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-16 text-white">
      <section className="print-surface mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/88 shadow-[0_28px_90px_rgba(2,6,23,0.56)]">
        <div className="h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
        <div className="p-7 text-center sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
            Paladin Compliance Verification
          </p>
          <h1 className="mt-5 text-3xl font-black text-white">
            Verification Page Not Found
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300 print-muted">
            No Paladin Compliance verification page is associated with this
            public URL.
          </p>
          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
            /verify/{slug || "unknown"}
          </div>
        </div>
      </section>
    </main>
  );
}
