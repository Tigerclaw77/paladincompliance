"use client";

import CheckoutButton from "@/components/CheckoutButton";
import ManageBillingButton from "@/components/billing/ManageBillingButton";
import {
  getCoveragePriceKey,
  getPaladinPlanName,
  getPaladinPriceItem,
  type CoveragePlanKey,
} from "@/lib/paladin/pricing";

type SubscribeActionsProps = {
  employeeCount?: number | null;
  hasStripeCustomer: boolean;
  hipaaEnabled?: boolean;
  plan?: CoveragePlanKey;
};

export default function SubscribeActions({
  employeeCount,
  hasStripeCustomer,
  hipaaEnabled = false,
  plan = "starter",
}: SubscribeActionsProps) {
  const priceKey = getCoveragePriceKey({
    employeeCount,
    hipaaEnabled,
    plan,
  });
  const priceItem = getPaladinPriceItem(priceKey);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CheckoutButton
        label={`Start ${getPaladinPlanName(priceItem)}`}
        priceKey={priceKey}
      />
      <ManageBillingButton
        disabled={!hasStripeCustomer}
        disabledReason="Billing portal access appears after Stripe creates the customer record."
      />
    </div>
  );
}
