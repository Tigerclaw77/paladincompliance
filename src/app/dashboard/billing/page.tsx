import Link from "next/link";
import ManageBillingButton from "@/components/billing/ManageBillingButton";
import SubscribeActions from "@/components/billing/SubscribeActions";
import {
  getAcquisitionIntentPlanLabel,
  resolveCoveragePlanSnapshot,
} from "@/lib/paladin/billing/coveragePlan";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import { resolveOrganizationEntitlements } from "@/lib/paladin/entitlements/service";
import { formatDisplayDate } from "@/lib/paladin/verification";
import { getStripeCatalogItemByPriceId } from "@/lib/stripe/catalog";
import { isSubscriptionVerificationActive } from "@/lib/stripe/subscriptions";

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string;
    intent?: string;
    portal?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const { organization } = await getCurrentOrganization();
  const params = await searchParams;
  const acquisitionIntent = organization.acquisitionIntent;
  const subscription = organization.subscription;
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent,
    subscription,
  });
  const planSnapshot = resolveCoveragePlanSnapshot({
    acquisitionIntent,
    subscription,
  });
  const hasActiveSubscription = entitlements.hasActiveSubscription;
  const hasStripeCustomer = Boolean(subscription?.stripeCustomerId);
  const isEnterpriseIntent =
    acquisitionIntent?.plan === "ENTERPRISE" ||
    (acquisitionIntent?.plan === "GROWTH" &&
      (acquisitionIntent.employeeCount ?? 0) > 250);
  const selectedPlan = getSelectedPlanLabel({
    acquisitionIntent,
    planLabel: planSnapshot.label,
  });
  const subscriptionStatus = getSubscriptionStatusLabel(subscription?.status);
  const renewalDate = hasActiveSubscription
    ? formatDisplayDate(subscription?.currentPeriodEnd)
    : "";
  const checkoutMessage = getCheckoutMessage(params.checkout, params.intent);
  const portalMessage = getPortalMessage(params.portal);
  const verificationSlug =
    organization.verificationPage?.slug ?? organization.slug;
  const certificateHref = `/api/verification-certificate/${verificationSlug}`;
  const upgradeAvailable = hasUpgradeAvailable(subscription?.stripePriceId);

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Billing
        </p>
        <div className="mt-4 max-w-3xl">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Subscription billing
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Manage checkout, renewal, and Stripe billing records for{" "}
            {organization.name}.
          </p>
        </div>
      </header>

      {checkoutMessage && (
        <section className="rounded-xl border border-blue-300/20 bg-blue-300/10 px-5 py-4 text-sm font-semibold leading-6 text-blue-100">
          {checkoutMessage}
        </section>
      )}

      {portalMessage && (
        <section className="rounded-xl border border-blue-300/20 bg-blue-300/10 px-5 py-4 text-sm font-semibold leading-6 text-blue-100">
          {portalMessage}
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
        <div className="h-1 bg-gradient-to-r from-transparent via-blue-300 to-amber-200" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
              Billing
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Subscription
            </h2>
            {!hasActiveSubscription && acquisitionIntent && (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                Checkout not completed.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            {hasActiveSubscription ? (
              <>
                <ManageBillingButton
                  disabled={!hasStripeCustomer}
                  disabledReason="Billing portal access appears after Stripe creates the customer record."
                  variant="primary"
                />
                {upgradeAvailable && (
                  <SecondaryActionLink href="/pricing" label="Upgrade Plan" />
                )}
              </>
            ) : isEnterpriseIntent ? (
              <SecondaryActionLink href="/start/enterprise" label="Contact Sales" />
            ) : acquisitionIntent ? (
              <SubscribeActions
                checkoutLabel="Complete Checkout"
                employeeCount={acquisitionIntent.employeeCount}
                hipaaEnabled={Boolean(acquisitionIntent.hipaaEnabled)}
                plan={getCheckoutPlan(acquisitionIntent.plan)}
                showManageBilling={false}
              />
            ) : (
              <PrimaryActionLink href="/pricing" label="Select Plan" />
            )}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
            <BillingLine label="Subscription Status" value={subscriptionStatus} />
            <BillingLine label="Selected Plan" value={selectedPlan} />
            {hasActiveSubscription && (
              <BillingLine label="Renews On" value={renewalDate} />
            )}
          </dl>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Stripe Record
          </p>
          <dl className="mt-5 grid gap-4">
            <BillingDetail
              label="Customer"
              value={subscription?.stripeCustomerId ?? "Not recorded"}
            />
            <BillingDetail
              label="Subscription"
              value={subscription?.stripeSubscriptionId ?? "Not recorded"}
            />
            <BillingDetail
              label="Price"
              value={subscription?.stripePriceId ?? "Pending"}
            />
            <BillingDetail
              label="Billing Term"
              value={getBillingTermLabel(subscription?.billingInterval)}
            />
            <BillingDetail
              label="Cancel at Period End"
              value={subscription?.cancelAtPeriodEnd ? "Yes" : "No"}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Subscription Access
          </p>
          <div className="mt-5 grid gap-3">
            <AccessLine
              allowed={entitlements.features.binderPdfGeneration.allowed}
              href="/dashboard/assets"
              label="Binder PDF generation"
            />
            <AccessLine
              allowed={entitlements.features.downloadableAssets.allowed}
              href="/dashboard/assets"
              label="Downloadable assets"
            />
            <AccessLine
              allowed={entitlements.features.hipaaAddOn.allowed}
              href={
                entitlements.features.hipaaAddOn.allowed
                  ? "/dashboard/assets"
                  : "/pricing"
              }
              label={
                entitlements.features.hipaaAddOn.allowed
                  ? "HIPAA materials"
                  : "HIPAA add-on"
              }
            />
            <AccessLine
              allowed={entitlements.features.verificationModules.allowed}
              href={`/verify/${verificationSlug}`}
              label="Public verification tools"
            />
            <AccessLine
              allowed={entitlements.features.downloadableAssets.allowed}
              href={certificateHref}
              label="Verification certificate"
            />
          </div>
        </section>
      </section>
    </div>
  );
}

function BillingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-xl font-black text-white">{value}</dd>
    </div>
  );
}

function BillingDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-all rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-slate-200">
        {value}
      </dd>
    </div>
  );
}

function AccessLine({
  allowed,
  href,
  label,
}: {
  allowed: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.08]"
      href={href}
    >
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <span
        className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
          allowed
            ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
            : "border-slate-400/25 bg-slate-400/10 text-slate-300"
        }`}
      >
        {allowed ? "Available" : "Pending"}
      </span>
    </Link>
  );
}

function PrimaryActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="inline-flex h-12 items-center justify-center rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] transition hover:from-blue-600 hover:to-blue-400"
      href={href}
    >
      {label}
    </Link>
  );
}

function SecondaryActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white transition hover:bg-white/[0.08]"
      href={href}
    >
      {label}
    </Link>
  );
}

function getCheckoutMessage(
  checkout: string | undefined,
  intent: string | undefined
) {
  if (checkout === "success") {
    return "Checkout completed. Subscription status will update after Stripe confirms the subscription.";
  }

  if (checkout === "cancel" || checkout === "not-started" || intent === "saved") {
    return "Checkout not completed.";
  }

  return "";
}

function getPortalMessage(portal: string | undefined) {
  if (portal === "return") {
    return "Returned from Stripe Billing Portal.";
  }

  return "";
}

function getCheckoutPlan(
  plan: string | null | undefined
): "operational" | "starter" {
  return plan === "GROWTH" ? "operational" : "starter";
}

function getSelectedPlanLabel({
  acquisitionIntent,
  planLabel,
}: {
  acquisitionIntent: Parameters<typeof getAcquisitionIntentPlanLabel>[0] | null;
  planLabel: string;
}) {
  if (planLabel && planLabel !== "Coverage not selected") {
    return planLabel;
  }

  return acquisitionIntent
    ? getAcquisitionIntentPlanLabel(acquisitionIntent)
    : "Not selected";
}

function getSubscriptionStatusLabel(status: string | null | undefined) {
  if (isSubscriptionVerificationActive(status)) {
    return "Active";
  }

  if (status === "past_due" || status === "unpaid") {
    return "Payment Review";
  }

  return "Not Active";
}

function getBillingTermLabel(interval: string | null | undefined) {
  if (interval === "year") {
    return "Annual";
  }

  if (interval === "month") {
    return "Monthly";
  }

  return "Not recorded";
}

function hasUpgradeAvailable(priceId: string | null | undefined) {
  const catalogItem = getStripeCatalogItemByPriceId(priceId);

  if (!catalogItem || catalogItem.family !== "coverage") {
    return false;
  }

  return catalogItem.key !== "operational101To250Hipaa";
}
