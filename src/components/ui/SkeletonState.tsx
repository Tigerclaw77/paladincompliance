type SkeletonStateProps = {
  rows?: number;
  title?: string;
};

export default function SkeletonState({
  rows = 4,
  title = "Loading workspace",
}: SkeletonStateProps) {
  return (
    <section
      aria-busy="true"
      aria-label={title}
      className="grid gap-6"
      role="status"
    >
      <div className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <div className="h-3 w-40 animate-pulse rounded-full bg-amber-200/20" />
        <div className="mt-5 h-10 max-w-xl animate-pulse rounded-lg bg-white/10" />
        <div className="mt-4 h-4 max-w-2xl animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            className="rounded-xl border border-white/10 bg-slate-900/90 p-5"
            key={index}
          >
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    </section>
  );
}
