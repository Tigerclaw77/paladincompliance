import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    status?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const initialMessage =
    params.status === "check-email"
      ? "Check your email for a secure Paladin sign-in link."
      : undefined;

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto flex min-h-[620px] max-w-6xl items-center justify-center">
        <section className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-slate-900/92 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          <div className="relative p-7 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0),rgba(30,58,138,0.18))]" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Paladin Compliance
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
                Secure Account Access
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Receive a one-time sign-in link for your compliance workspace.
                No passwords are stored or reused.
              </p>

              <LoginForm
                callbackUrl={callbackUrl}
                initialMessage={initialMessage}
              />

              {params.error && (
                <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  The sign-in link could not be verified. Please request a new
                  link.
                </p>
              )}

              <p className="mt-6 text-xs leading-5 text-slate-500">
                Access is protected with secure, HTTP-only session cookies.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function safeCallbackUrl(callbackUrl: string | undefined) {
  if (!callbackUrl || !callbackUrl.startsWith("/")) {
    return "/dashboard";
  }

  return callbackUrl;
}
