"use client";

type ErrorStateProps = {
  actionLabel?: string;
  message?: string;
  onAction?: () => void;
  title?: string;
};

export default function ErrorState({
  actionLabel = "Try Again",
  message = "The request could not be completed. Please try again, or contact support if this continues.",
  onAction,
  title = "Something needs attention",
}: ErrorStateProps) {
  return (
    <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">
        Operational Notice
      </p>
      <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
        {message}
      </p>
      {onAction && (
        <button
          className="mt-5 rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-2.5 text-sm font-black text-blue-100 transition hover:bg-blue-400/15"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}
