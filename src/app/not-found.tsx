export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-950 px-6 py-20 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Paladin Compliance
        </p>
        <h1 className="mt-5 text-3xl font-black tracking-tight">
          Page not available
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          The requested page may not exist, may require a different workspace,
          or may not be available to the current user.
        </p>
      </section>
    </main>
  );
}
