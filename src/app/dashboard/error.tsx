"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <ErrorState
          message="The dashboard could not finish loading. No account data was changed."
          onAction={reset}
          title="Dashboard temporarily unavailable"
        />
      </div>
    </main>
  );
}
