import PricingClient from "@/app/pricing/PricingClient";

type PricingPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;

  return <PricingClient checkoutCanceled={params.checkout === "binder-cancel"} />;
}
