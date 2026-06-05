"use client";

import { useState } from "react";

type PortalSessionResponse = {
  error?: string;
  url?: string;
};

export default function ManageBillingButton({
  disabled = false,
  disabledReason,
  variant = "secondary",
}: {
  disabled?: boolean;
  disabledReason?: string;
  variant?: "primary" | "secondary";
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const payload = await readPortalSessionResponse(response);

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to open billing portal.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to open billing portal."
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        aria-busy={isLoading}
        className={`h-12 rounded-lg px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
          variant === "primary"
            ? "border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 shadow-[0_14px_32px_rgba(37,99,235,0.24)] hover:from-blue-600 hover:to-blue-400"
            : "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
        }`}
        disabled={disabled || isLoading}
        onClick={handleClick}
        type="button"
      >
        {isLoading ? "Opening Portal..." : "Manage Billing"}
      </button>
      {errorMessage && (
        <p className="text-sm leading-6 text-red-100" role="alert">
          {errorMessage}
        </p>
      )}
      {disabled && disabledReason && !errorMessage && (
        <p className="text-xs font-semibold leading-5 text-slate-500">
          {disabledReason}
        </p>
      )}
    </div>
  );
}

async function readPortalSessionResponse(response: Response) {
  try {
    return (await response.json()) as PortalSessionResponse;
  } catch {
    return {
      error: "Billing management could not be opened. Please try again.",
    };
  }
}
