import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/paladin/admin/auth";
import { releaseRevisionWithPrisma } from "@/lib/paladin/benefits/server";
import { validateRevisionInput } from "@/lib/paladin/benefits/revisions";
import { isEmailProviderConfigured } from "@/lib/paladin/env";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Binder revisions (admin)" };

type PageProps = {
  searchParams: Promise<{
    error?: string;
    notified?: string;
    sent?: string;
    failed?: string;
    already?: string;
    version?: string;
  }>;
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-slate-500";

async function publishRevision(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const parsed = validateRevisionInput({
    changes: String(formData.get("changes") ?? ""),
    releasedBy: admin.email,
    summary: String(formData.get("summary") ?? ""),
    title: String(formData.get("title") ?? ""),
    version: String(formData.get("version") ?? ""),
  });

  if (!parsed.ok) {
    redirect(`/admin/revisions?error=${encodeURIComponent(parsed.error)}`);
  }

  const result = await releaseRevisionWithPrisma(parsed.value);

  logOperationalEvent("info", "binder_revision_released", {
    alreadyNotified: result.alreadyNotified,
    emailConfigured: result.emailConfigured,
    failed: result.failed,
    releasedBy: admin.email,
    sent: result.sent,
    version: result.version,
  });

  const query = new URLSearchParams({
    already: String(result.alreadyNotified),
    failed: String(result.failed),
    notified: result.emailConfigured ? "1" : "0",
    sent: String(result.sent),
    version: result.version,
  });

  redirect(`/admin/revisions?${query.toString()}`);
}

export default async function AdminRevisionsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const revisions = await prisma.binderRevision.findMany({
    include: { _count: { select: { notices: true } } },
    orderBy: { releasedAt: "desc" },
    take: 50,
  });
  const emailConfigured = isEmailProviderConfigured();

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Subscriber benefit
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">Binder revisions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Publishing a revision adds it to every member&apos;s Updates page and
          emails the owners and admins of organizations with an active
          subscription, once each. Re-publishing the same version only emails
          recipients who have not yet received it.
        </p>
        {!emailConfigured && (
          <p className="mt-4 rounded-xl border border-amber-200/25 bg-amber-200/10 p-4 text-sm font-semibold text-amber-100">
            No email provider is configured (EMAIL_SERVER). Revisions will be
            logged but no notification email will be sent.
          </p>
        )}
      </header>

      {params.error && (
        <p className="rounded-xl border border-red-300/30 bg-red-300/10 p-4 text-sm font-bold text-red-100">
          {params.error}
        </p>
      )}
      {params.version && (
        <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-semibold text-emerald-100">
          Revision {params.version} recorded.{" "}
          {params.notified === "1"
            ? `Emails sent: ${params.sent}; already notified: ${params.already}; failed: ${params.failed}.`
            : "No email was sent because no email provider is configured."}
        </p>
      )}

      <form
        action={publishRevision}
        className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/90 p-6"
      >
        <label className="grid gap-1 text-xs font-bold text-slate-300">
          Version (for example 2027.1)
          <input className={inputClass} maxLength={32} name="version" required />
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-300">
          Title
          <input className={inputClass} maxLength={150} name="title" required />
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-300">
          Summary (shown in the email and the revision log)
          <textarea className={inputClass} maxLength={1000} name="summary" required rows={3} />
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-300">
          What changed (optional, one item per line)
          <textarea className={inputClass} maxLength={5000} name="changes" rows={5} />
        </label>
        <div>
          <button
            className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-400"
            type="submit"
          >
            Publish revision and email subscribers
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
        <h2 className="text-lg font-black text-white">Released revisions</h2>
        {revisions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">None yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2 text-sm text-slate-300">
            {revisions.map((revision) => (
              <li className="border-t border-white/10 py-2" key={revision.id}>
                <strong className="text-white">{revision.version}</strong>{" "}
                {revision.title} ({revision.releasedAt.toISOString().slice(0, 10)}
                ), emailed {revision._count.notices}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
