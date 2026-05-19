import Link from "next/link";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  eyebrow?: string;
  message: string;
  title: string;
};

export default function EmptyState({
  actionHref,
  actionLabel,
  eyebrow = "No Records",
  message,
  title,
}: EmptyStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-lg font-black text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        {message}
      </p>
      {actionHref && actionLabel && (
        <Link
          className="mt-4 inline-flex rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-2.5 text-sm font-black text-blue-100 transition hover:bg-blue-400/15"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      )}
    </section>
  );
}
