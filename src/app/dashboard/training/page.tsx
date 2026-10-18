import Link from "next/link";
import LockedFeature from "@/components/entitlements/LockedFeature";
import { getMemberAccess } from "@/lib/paladin/memberAccess";
import {
  TRAINING_ACKNOWLEDGMENT_NOTICE,
  TRAINING_MODULES,
  acknowledgmentStatus,
} from "@/lib/paladin/training/content";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Training acknowledgments" };

export default async function TrainingPage() {
  const { entitlements, hasActiveMembership, organization } = await getMemberAccess();
  const acknowledgments = hasActiveMembership
    ? await prisma.trainingAcknowledgment.findMany({
        orderBy: { acknowledgedOn: "desc" },
        take: 500,
        where: { organizationId: organization.id },
      })
    : [];
  const today = new Date();

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Training
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Staff training acknowledgments
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
          Three short reading modules (about 7-10 minutes each) on AI acceptable
          use, data handling with AI tools, and incident reporting. Staff read
          the module (on screen or printed) and the owner or admin records who
          acknowledged it and when. Staff do not need accounts.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-400">
          {TRAINING_ACKNOWLEDGMENT_NOTICE}
        </p>
      </header>

      {!hasActiveMembership ? (
        <LockedFeature
          entitlement={entitlements.features.trainingModules}
          title="Training modules become available with an active membership"
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {TRAINING_MODULES.map((module) => {
              const rows = acknowledgments.filter((a) => a.moduleSlug === module.slug);
              const latest = rows[0]?.acknowledgedOn.toISOString().slice(0, 10) ?? null;
              const status = acknowledgmentStatus(latest, today);

              return (
                <Link
                  className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 hover:bg-slate-900"
                  href={`/dashboard/training/${module.slug}`}
                  key={module.slug}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    About {module.minutes} min
                  </p>
                  <h2 className="mt-2 text-lg font-black text-white">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{module.summary}</p>
                  <p className="mt-3 text-xs font-bold text-blue-200">
                    {rows.length} acknowledgment{rows.length === 1 ? "" : "s"} recorded
                    {status === "due" ? " (latest is over 12 months old)" : ""}
                  </p>
                </Link>
              );
            })}
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">Acknowledgment roster</h2>
              <a
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.09]"
                href="/api/training/export"
              >
                Export CSV
              </a>
            </div>
            {acknowledgments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">None recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Person</th>
                      <th className="py-2 pr-3">Role</th>
                      <th className="py-2 pr-3">Module</th>
                      <th className="py-2">Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acknowledgments.map((a) => (
                      <tr className="border-t border-white/10" key={a.id}>
                        <td className="py-2 pr-3">{a.acknowledgedOn.toISOString().slice(0, 10)}</td>
                        <td className="py-2 pr-3">{a.personName}</td>
                        <td className="py-2 pr-3">{a.personRole}</td>
                        <td className="py-2 pr-3">
                          {TRAINING_MODULES.find((m) => m.slug === a.moduleSlug)?.title ?? a.moduleSlug}
                        </td>
                        <td className="py-2">{a.moduleVersion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
