import Link from "next/link";
import VerificationQrCard from "@/components/verification/VerificationQrCard";
import {
  formatLifecycleDate,
  type ModuleBadge,
  type StatusTone,
  type VerificationLifecycle,
} from "@/lib/paladin/verification";

export type RegistryRecordViewProps = {
  activeModules: ModuleBadge[];
  activeThroughDate?: Date | null;
  recordDownloadHref?: string;
  displayVerificationUrl?: string;
  issueDate: Date;
  lifecycle: VerificationLifecycle;
  organizationName: string;
  organizationSlug: string;
  planLabel: string;
  planStatusLabel: string;
  revisionId: string;
  sample?: boolean;
  verificationId: string;
  verificationUrl: string;
};

export default function RegistryRecordView({
  activeModules,
  activeThroughDate,
  recordDownloadHref,
  displayVerificationUrl,
  issueDate,
  lifecycle,
  organizationName,
  organizationSlug,
  planLabel,
  planStatusLabel,
  revisionId,
  sample = false,
  verificationId,
  verificationUrl,
}: RegistryRecordViewProps) {
  const isActiveVerification = lifecycle.state === "active";
  const activeModuleCount = activeModules.filter(
    (module) => module.tone === "active"
  ).length;
  const coverageSignalTone: StatusTone = isActiveVerification ? "active" : lifecycle.tone;

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
          {sample && (
            <div
              className="rounded-2xl border-2 border-dashed border-amber-300/60 bg-amber-300/10 p-5 text-sm font-bold leading-6 text-amber-100"
              role="note"
            >
              SAMPLE ONLY. &ldquo;Example Organization (Sample)&rdquo; is a
              fictitious organization and every value on this page is made-up
              demonstration data. It is not a real customer, and this QR code
              does not point to a real record.
            </div>
          )}
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
                  {sample ? "Sample Registry Record" : "Public Registry Record"}
                </p>
                <h1 className="mt-6 max-w-[18rem] break-words text-3xl font-black leading-[1.04] text-white sm:max-w-4xl sm:text-5xl lg:text-7xl">
                  {organizationName}
                </h1>
                <div className="mt-7 flex max-w-full flex-wrap items-center gap-3">
                  <StatusPill lifecycle={lifecycle} />
                  <span className="max-w-full break-words rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 sm:text-xs sm:tracking-[0.16em]">
                    Plan status: {planStatusLabel}
                  </span>
                  <span className="max-w-full break-all rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-100 sm:text-xs sm:tracking-[0.16em]">
                    ID {verificationId}
                  </span>
                </div>
                <p className="mt-7 max-w-[19rem] text-lg leading-8 text-slate-300 print-muted sm:max-w-3xl">
                  This page is a public registry record showing that an AI Policy
                  &amp; Evidence Binder was issued to {organizationName} by
                  Paladin Compliance. It is a record of issuance, not a
                  certification or an independent review.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 print:hidden">
                  {recordDownloadHref && (
                    <Link
                      className="rounded-lg border border-amber-200/35 bg-amber-200/12 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-200/18"
                      href={recordDownloadHref}
                    >
                      Download Registry Record (PDF)
                    </Link>
                  )}
                </div>
              </div>

              <OfficialSeal lifecycle={lifecycle} verificationId={verificationId} />
            </div>

            <div className="relative grid border-t border-white/10 bg-slate-950/22 md:grid-cols-2 xl:grid-cols-3">
              <HeroDatum
                label="Organization"
                value={organizationName}
              />
              <HeroDatum
                label="Record Status"
                value={lifecycle.badgeLabel}
              />
              <HeroDatum
                label="Issue Date"
                value={formatLifecycleDate(issueDate)}
              />
              <HeroDatum
                label="Record Active Through"
                value={formatLifecycleDate(activeThroughDate)}
              />
              <HeroDatum
                label="Revision ID"
                value={revisionId}
              />
              <HeroDatum
                label="Registry ID"
                value={verificationId}
              />
            </div>
          </section>

          {lifecycle.state !== "active" && (
            <StatusNotice
              lifecycle={lifecycle}
              subscriptionStatus={planStatusLabel}
            />
          )}

          <section className="grid gap-8 lg:grid-cols-[1fr_0.84fr]">
            <section className="print-surface rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-9">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">
                    Record Overview
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-white">
                    What this record shows
                  </h2>
                </div>
                <p className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
                  {isActiveVerification
                    ? `${activeModuleCount} items recorded`
                    : lifecycle.badgeLabel}
                </p>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <TrustSignal
                  detail="A Paladin-hosted page that anyone can open to see that a binder was issued to this organization."
                  label="Public registry record"
                  tone={lifecycle.tone}
                />
                <TrustSignal
                  detail="Records the AI Policy &amp; Evidence Binder issued to this organization. It does not describe how the organization uses AI."
                  label="Binder issued"
                  tone={coverageSignalTone}
                />
                <TrustSignal
                  detail="Records are refreshed on an annual cycle while the plan is current."
                  label="Annual update cycle"
                  tone={coverageSignalTone}
                />
                <TrustSignal
                  detail="Issued and maintained by Paladin Compliance. Not issued by a government agency or independent third party."
                  label="Issuer"
                  tone="draft"
                />
                <TrustSignal
                  detail={`${verificationId} is the Paladin registry ID for this record.`}
                  label="Registry reference"
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
              organizationName={organizationName}
              variant="public"
              verificationUrl={verificationUrl}
              displayVerificationUrl={displayVerificationUrl}
            />
          </section>

          <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="print-surface rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">
                Binder Record
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Binder record items
              </h2>
              <div className="mt-7 grid gap-4">
                {activeModules.map((module) => (
                  <PublicModuleBadge key={module.label} module={module} />
                ))}
              </div>
            </section>

            <section className="print-surface rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">
                Registry Details
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Registry record details
              </h2>
              <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                <RecordDetail label="Registry ID" value={verificationId} />
                <RecordDetail label="Revision ID" value={revisionId} />
                <RecordDetail label="Plan" value={planLabel} />
                <RecordDetail
                  label="Record Status"
                  value={lifecycle.badgeLabel}
                />
                <RecordDetail label="Organization Slug" value={organizationSlug} />
                <RecordDetail label="Issued By" value="Paladin Compliance" />
                <RecordDetail
                  label="Issue Date"
                  value={formatLifecycleDate(issueDate)}
                />
                <RecordDetail
                  label="Record Active Through"
                  value={formatLifecycleDate(activeThroughDate)}
                />
                <RecordDetail
                  label="Renewal State"
                  value={planStatusLabel}
                />
              </dl>
            </section>
          </section>

          <section className="print-surface rounded-3xl border border-amber-200/20 bg-amber-200/[0.06] p-7 shadow-[0_24px_80px_rgba(2,6,23,0.30)] sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100">
              Registry Note
            </p>
            <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-300 print-muted">
              Paladin Compliance issues and maintains this registry record so
              customers, insurers, and partners can confirm that this binder
              was issued to this organization. It is documentation only: not
              legal advice, not a certification, audit, or guarantee, and not
              a HIPAA, TRAIGA, or other regulatory approval. It does not show
              that the organization complies with any law or contract. For
              printed or forwarded copies, compare the public URL, current
              status, and Paladin reference shown here.
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
        aria-label={`Paladin registry record status, ${lifecycle.badgeLabel}`}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-100">
          Paladin Registry
        </p>
        <p className="mt-5 text-3xl font-black text-white">
          {lifecycle.badgeLabel}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300 print-muted">
          {lifecycle.description}
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Registry Reference
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
        Current plan status is {subscriptionStatus.toLowerCase()}. This
        registry record remains visible while it is activated, reviewed, or
        renewed.
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
            {getModuleStateLabel(module)}
          </p>
          <h3 className="mt-2 text-base font-black text-white">
            {module.label}
          </h3>
        </div>
        <span className="rounded-full border border-current/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
          {module.tone === "active" ? "Recorded" : "Listed"}
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

function getModuleStateLabel(module: ModuleBadge) {
  if (module.stateLabel) {
    return module.stateLabel;
  }

  const tone = module.tone;

  if (tone === "active") {
    return "Recorded";
  }

  if (tone === "warning") {
    return "Review Needed";
  }

  if (tone === "draft") {
    return "Not yet recorded";
  }

  return "Not Active";
}

