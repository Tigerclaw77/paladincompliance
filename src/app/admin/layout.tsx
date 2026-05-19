import Link from "next/link";
import { requireAdmin } from "@/lib/paladin/admin/auth";

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organizations", label: "Organizations" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-6 text-white">
      <div className="absolute inset-x-0 top-16 -z-0 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.24),transparent_34%),radial-gradient(circle_at_top_right,rgba(198,168,91,0.12),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            Paladin Admin
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-white">
            Operations
          </h1>
          <p className="mt-3 break-all text-xs leading-5 text-slate-400">
            Signed in as {admin.email}
          </p>
          <nav className="mt-6 grid gap-2">
            {adminNavItems.map((item) => (
              <Link
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200 transition hover:border-blue-300/30 hover:bg-blue-300/[0.06]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-200/[0.06] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">
              Internal Only
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Access is restricted by server-side admin email allowlist.
            </p>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
