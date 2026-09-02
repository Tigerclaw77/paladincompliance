import type { ModuleBadge as ModuleBadgeValue } from "@/lib/paladin/verification";

type ModuleBadgeProps = {
  module: ModuleBadgeValue;
};

const toneClasses: Record<ModuleBadgeValue["tone"], string> = {
  active: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  draft: "border-blue-300/25 bg-blue-300/10 text-blue-100",
  warning: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  inactive: "border-slate-400/25 bg-slate-400/10 text-slate-200",
};

export default function ModuleBadge({ module }: ModuleBadgeProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${toneClasses[module.tone]}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        <p className="text-sm font-black">{module.label}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-300">
        {module.description}
      </p>
    </div>
  );
}
