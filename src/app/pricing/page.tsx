import type { Metadata } from "next";
import PricingClient from "@/app/pricing/PricingClient";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Paladin Compliance coverage options for AI governance documentation, public verification, binder materials, and digital update access.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | Paladin Compliance",
    description:
      "Compare Paladin Compliance coverage options for AI governance documentation, public verification, binder materials, and digital update access.",
    url: "/pricing",
  },
  twitter: {
    title: "Pricing | Paladin Compliance",
    description:
      "Compare Paladin Compliance coverage options for AI governance documentation, public verification, binder materials, and digital update access.",
  },
};

type PricingPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;

  return <PricingClient checkoutCanceled={params.checkout === "binder-cancel"} />;
}
