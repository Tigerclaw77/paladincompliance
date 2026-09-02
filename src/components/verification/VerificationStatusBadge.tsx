import type { StatusTone } from "@/lib/paladin/verification";
import {
  getStatusLabel,
  getStatusTone,
  type VerificationLifecycle,
} from "@/lib/paladin/verification";

type VerificationStatusBadgeProps = {
  className?: string;
  lifecycle?: VerificationLifecycle;
  status: string | null | undefined;
};

const toneStyles: Record<StatusTone, string> = {
  active: "border-emerald-300/30 bg-emerald-300/12 text-emerald-100",
  draft: "border-blue-300/30 bg-blue-300/12 text-blue-100",
  warning: "border-amber-300/35 bg-amber-300/12 text-amber-100",
  inactive: "border-slate-400/25 bg-slate-400/10 text-slate-200",
};

export default function VerificationStatusBadge({
  className = "",
  lifecycle,
  status,
}: VerificationStatusBadgeProps) {
  const tone = lifecycle?.tone ?? getStatusTone(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${toneStyles[tone]} ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-current shadow-[0_0_16px_currentColor]" />
      {lifecycle?.badgeLabel ?? getStatusLabel(status)}
    </span>
  );
}
