"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <ErrorState
          message="Paladin could not complete the request. Please retry the operation."
          onAction={reset}
          title="Request could not be completed"
        />
      </div>
    </main>
  );
}
