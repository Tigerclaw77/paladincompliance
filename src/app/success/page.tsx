import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type SuccessPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const isBinderCheckout = params.checkout === "binder-success";
  const isStarterCheckout = params.checkout === "starter-success";

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-16 text-white">
      <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.42)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          Checkout Complete
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
          {isBinderCheckout
            ? "Binder Order Received"
            : isStarterCheckout
              ? "Starter Membership Received"
              : "Checkout Received"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          {isBinderCheckout
            ? "Your Paladin binder checkout was completed. Paladin will use the Stripe record to ship the printed binder to the address you provided; no delivery date is guaranteed."
            : isStarterCheckout
              ? "Thank you. Your organization workspace is being created now. Sign in with the same email address you used at checkout to finish setup; you'll receive a secure sign-in link. Your initial binder ships to the address you provided."
              : "Your Paladin checkout was completed."}
        </p>
        {isStarterCheckout && (
          <Link
            className="mt-6 mr-3 inline-flex rounded-lg border border-amber-200/30 bg-amber-200/10 px-4 py-2.5 text-sm font-black text-amber-100 transition hover:bg-amber-200/15"
            href="/login"
          >
            Sign in to your workspace
          </Link>
        )}
        <Link
          className="mt-6 inline-flex rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-2.5 text-sm font-black text-blue-100 transition hover:bg-blue-400/15"
          href="/pricing"
        >
          Return to Pricing
        </Link>
      </section>
    </main>
  );
}
