import type { OrganizationEntitlements } from "@/lib/paladin/entitlements/service";

type SubscriptionEntitlementBadgeProps = {
  entitlements: Pick<
    OrganizationEntitlements,
    "planLabel" | "status" | "statusLabel"
  >;
};

const statusClasses: Record<OrganizationEntitlements["status"], string> = {
  active: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  canceled: "border-slate-400/25 bg-slate-400/10 text-slate-200",
  incomplete: "border-amber-200/30 bg-amber-200/10 text-amber-100",
  incomplete_expired: "border-slate-400/25 bg-slate-400/10 text-slate-200",
  inactive: "border-slate-400/25 bg-slate-400/10 text-slate-200",
  past_due: "border-amber-200/30 bg-amber-200/10 text-amber-100",
  pending_checkout: "border-blue-300/30 bg-blue-300/10 text-blue-100",
  trialing: "border-blue-300/30 bg-blue-300/10 text-blue-100",
  unpaid: "border-amber-200/30 bg-amber-200/10 text-amber-100",
};

export default function SubscriptionEntitlementBadge({
  entitlements,
}: SubscriptionEntitlementBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${statusClasses[entitlements.status]}`}
    >
      <span>{entitlements.planLabel}</span>
      <span className="h-1 w-1 rounded-full bg-current opacity-60" />
      <span>{entitlements.statusLabel}</span>
    </div>
  );
}
