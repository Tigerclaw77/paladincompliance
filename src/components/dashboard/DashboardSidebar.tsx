import Link from "next/link";
import { signOut } from "@/auth";

type DashboardSidebarProps = {
  organizationName: string;
  verificationSlug: string;
};

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/assets", label: "Assets" },
  { href: "/dashboard/spend-record", label: "AI Spend Record" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/training", label: "Training" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/updates", label: "Updates" },
];

export default function DashboardSidebar({
  organizationName,
  verificationSlug,
}: DashboardSidebarProps) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-slate-900/88 p-5 shadow-[0_22px_70px_rgba(2,6,23,0.38)] lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          Paladin
        </p>
        <h2 className="mt-3 text-xl font-black leading-tight text-white">
          {organizationName}
        </h2>
        <p className="mt-2 break-all text-xs leading-5 text-slate-500">
          /verify/{verificationSlug}
        </p>
      </div>

      <nav className="mt-7 grid gap-2">
        {navItems.map((item) => (
          <Link
            className="rounded-lg border border-white/0 px-3 py-2.5 text-sm font-bold text-slate-300 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-7 border-t border-white/10 pt-5">
        <Link
          className="block rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-2.5 text-sm font-black text-blue-100 transition hover:bg-blue-400/15"
          href={`/verify/${verificationSlug}`}
        >
          Registry Record
        </Link>

        <form action={signOutAction} className="mt-3">
          <button
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            type="submit"
          >
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

async function signOutAction() {
  "use server";

  await signOut({
    redirectTo: "/login",
  });
}
