import type { Metadata } from "next";
import Link from "next/link";
import BinderCheckoutControls from "@/components/billing/BinderCheckoutControls";
import {
  formatPaladinPrice,
  getPaladinPriceItem,
} from "@/lib/paladin/pricing";

export const metadata: Metadata = {
  title: "Order a Compliance Binder",
  description:
    "Order the Paladin Compliance Binder as a one-time purchase without creating an account.",
  alternates: {
    canonical: "/order",
  },
};

type OrderPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export default async function OrderPage({ searchParams }: OrderPageProps) {
  const params = await searchParams;
  const binder = getPaladinPriceItem("complianceBinder");

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-16 text-white">
      <section className="mx-auto grid max-w-2xl gap-6 rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.42)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
            One-Time Purchase
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
            Paladin Compliance Binder
          </h1>
          <p className="mt-3 text-2xl font-black text-amber-100">
            {formatPaladinPrice(binder)}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Order a physical Paladin Compliance Binder without starting a
            membership or creating an account. Stripe securely collects payment
            and the U.S. shipping address needed for fulfillment.
          </p>
        </div>

        {params.checkout === "binder-cancel" && (
          <div className="rounded-lg border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-100">
            Checkout was canceled. No payment was made.
          </div>
        )}

        <BinderCheckoutControls
          label="Order Binder"
          planName={binder.displayName}
          priceKey="complianceBinder"
          unitAmountCents={binder.amountCents}
          variant="dark"
        />

        <p className="text-xs leading-5 text-slate-400">
          Payment is processed by Stripe. You can review the quantity, total,
          and shipping details before submitting payment.
        </p>

        <Link
          className="text-sm font-bold text-blue-200 transition hover:text-white"
          href="/pricing"
        >
          Compare annual membership options
        </Link>
      </section>
    </main>
  );
}
