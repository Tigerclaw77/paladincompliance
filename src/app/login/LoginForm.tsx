"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

type LoginFormProps = {
  callbackUrl: string;
  initialMessage?: string;
};

export default function LoginForm({
  callbackUrl,
  initialMessage,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(initialMessage ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await signIn("nodemailer", {
        email: email.trim().toLowerCase(),
        redirect: false,
        redirectTo: callbackUrl,
      });

      if (!result.ok) {
        setErrorMessage(
          result.error ??
            "We could not send a secure sign-in link. Please try again."
        );
        return;
      }

      setSuccessMessage("Check your email for a secure Paladin sign-in link.");
      setEmail("");
    } catch {
      setErrorMessage(
        "We could not send a secure sign-in link. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-slate-200">
        Work email
        <input
          autoComplete="email"
          className="h-12 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
          disabled={isLoading}
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@organization.com"
          required
          type="email"
          value={email}
        />
      </label>

      <button
        aria-busy={isLoading}
        className="h-12 rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.28)] transition hover:from-blue-600 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Sending secure link..." : "Send Magic Link"}
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
