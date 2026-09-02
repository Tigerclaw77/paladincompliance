type VerificationMetricProps = {
  label: string;
  value: string;
};

export default function VerificationMetric({
  label,
  value,
}: VerificationMetricProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-white">{value}</p>
    </div>
  );
}
