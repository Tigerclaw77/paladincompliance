import Link from "next/link";
import type { FeatureEntitlement } from "@/lib/paladin/entitlements/service";
import { getPlanLabel } from "@/lib/paladin/entitlements/matrix";

type LockedFeatureProps = {
  compact?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  entitlement: FeatureEntitlement;
  title?: string;
};

export default function LockedFeature({
  compact = false,
  ctaHref = "/dashboard/billing",
  ctaLabel = "Review Billing",
  entitlement,
  title,
}: LockedFeatureProps) {
  const planLabel = entitlement.upgradePlan
    ? getPlanLabel(entitlement.upgradePlan)
    : getPlanLabel(entitlement.requiredPlan ?? "STARTER");

  return (
    <section
      className={`rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">
            Subscription Required
          </p>
          <h2
            className={`mt-3 font-black text-white ${
              compact ? "text-lg" : "text-2xl"
            }`}
          >
            {title ?? `${entitlement.label} becomes available after activation`}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            {entitlement.message}
          </p>
          {entitlement.upgradePlan && (
            <p className="mt-2 text-sm font-semibold text-amber-100">
              Available with {planLabel}.
            </p>
          )}
        </div>
        <Link
          className="inline-flex justify-center rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-2.5 text-sm font-black text-blue-100 transition hover:bg-blue-400/15"
          href={ctaHref}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
