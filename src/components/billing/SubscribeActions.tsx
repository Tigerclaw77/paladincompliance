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
  checkoutLabel?: string;
  employeeCount?: number | null;
  hasStripeCustomer?: boolean;
  hipaaEnabled?: boolean;
  plan?: CoveragePlanKey;
  showManageBilling?: boolean;
};

export default function SubscribeActions({
  checkoutLabel = "Complete Checkout",
  employeeCount,
  hasStripeCustomer = false,
  hipaaEnabled = false,
  plan = "starter",
  showManageBilling = true,
}: SubscribeActionsProps) {
  const priceKey = getCoveragePriceKey({
    employeeCount,
    hipaaEnabled,
    plan,
  });
  const priceItem = getPaladinPriceItem(priceKey);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="min-w-48">
        <CheckoutButton
          label={checkoutLabel || `Start ${getPaladinPlanName(priceItem)}`}
          priceKey={priceKey}
        />
      </div>
      {showManageBilling && (
        <ManageBillingButton
          disabled={!hasStripeCustomer}
          disabledReason="Billing portal access appears after Stripe creates the customer record."
        />
      )}
    </div>
  );
}
