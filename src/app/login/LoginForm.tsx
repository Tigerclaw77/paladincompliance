"use client";

import { useActionState, useEffect, useState } from "react";
import { sendMagicLink } from "./actions";

type LoginFormProps = {
  callbackUrl: string;
  initialMessage?: string;
};

export default function LoginForm({
  callbackUrl,
  initialMessage,
}: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(sendMagicLink, {
    message: "",
    status: "idle" as const,
  });
  const [email, setEmail] = useState("");
  const successMessage =
    state.status === "success"
      ? state.message
      : state.status === "idle"
        ? initialMessage ?? ""
        : "";
  const errorMessage = state.status === "error" ? state.message : "";

  useEffect(() => {
    if (state.status === "success") {
      setEmail("");
    }
  }, [state.status]);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />
      <label className="grid gap-2 text-sm font-semibold text-slate-200">
        Work email
        <input
          autoComplete="email"
          className="h-12 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
          disabled={isPending}
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@organization.com"
          required
          type="email"
          value={email}
        />
      </label>

      <button
        aria-busy={isPending}
        className="h-12 rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.28)] transition hover:from-blue-600 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending secure link..." : "Send Magic Link"}
      </button>

      {successMessage && (
        <div
          className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
    </form>
  );
}
