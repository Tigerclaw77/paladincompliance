import type { Metadata } from "next";
import PricingClient from "@/app/pricing/PricingClient";
import { getSupportEmail } from "@/lib/paladin/env";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pricing for the Paladin AI Policy & Evidence Binder: $249.99 binder, $499/yr Starter plan, and additional binders for subscribers. Documentation only; not legal advice or certification.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | Paladin Compliance",
    description:
      "Pricing for the Paladin AI Policy & Evidence Binder: $249.99 binder, $499/yr Starter plan, and additional binders for subscribers. Documentation only; not legal advice or certification.",
    url: "/pricing",
  },
  twitter: {
    title: "Pricing | Paladin Compliance",
    description:
      "Pricing for the Paladin AI Policy & Evidence Binder: $249.99 binder, $499/yr Starter plan, and additional binders for subscribers. Documentation only; not legal advice or certification.",
  },
};

type PricingPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;

  return (
    <PricingClient
      checkoutCanceled={params.checkout === "binder-cancel"}
      supportEmail={getSupportEmail()}
    />
  );
}
