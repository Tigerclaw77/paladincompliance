import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import { prisma } from "@/lib/prisma";

const updateItems = [
  {
    label: "Registry record profile",
    status: "Public registry record is available for review.",
  },
  {
    label: "Subscription sync",
    status: "Stripe subscription events are reflected in billing and registry record state.",
  },
  {
    label: "Downloadable assets",
    status:
      "The quick-reference binder record (PDF) and registry record downloads are available on the Assets page.",
  },
];

export default async function UpdatesPage() {
  const { organization } = await getCurrentOrganization();
  const revisions = await prisma.binderRevision.findMany({
    orderBy: { releasedAt: "desc" },
    take: 25,
  });

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Updates
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Updates and revision log
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
          Current checkpoints for {organization.name} and the log of binder
          binder revisions. Owners and admins of
          active memberships are emailed when a new revision is released.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
        <h2 className="text-lg font-black text-white">Binder revision log</h2>
        {revisions.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-slate-400">
            No revisions have been released yet. When one is released it will
            appear here and be emailed to your organization&apos;s owners and
            admins.
          </p>
        ) : (
          <ol className="mt-4 grid gap-3">
            {revisions.map((revision) => (
              <li
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                key={revision.id}
              >
                <p className="text-sm font-black text-white">
                  Revision {revision.version}: {revision.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Released {revision.releasedAt.toISOString().slice(0, 10)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {revision.summary}
                </p>
                {revision.changes && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-400">
                    {revision.changes}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
        <div className="grid gap-3">
          {updateItems.map((item) => (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
              key={item.label}
            >
              <p className="text-sm font-black text-white">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {item.status}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
