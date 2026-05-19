import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";

const updateItems = [
  {
    label: "Verification profile",
    status: "Public verification record is available for review.",
  },
  {
    label: "Coverage sync",
    status: "Stripe subscription events are reflected in billing and verification state.",
  },
  {
    label: "Downloadable assets",
    status: "Prepared for archived binder and policy records.",
  },
];

export default async function UpdatesPage() {
  const { organization } = await getCurrentOrganization();

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Updates
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Workspace provisioning
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
          Current operational checkpoints for {organization.name}, including
          renewal readiness and compliance package updates.
        </p>
      </header>

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
