import SubscribeActions from "@/components/billing/SubscribeActions";
import ManageBillingButton from "@/components/billing/ManageBillingButton";
import SubscriptionEntitlementBadge from "@/components/entitlements/SubscriptionEntitlementBadge";
import VerificationStatusBadge from "@/components/verification/VerificationStatusBadge";
import {
  formatDisplayDate,
  getStatusLabel,
  resolveVerificationLifecycle,
} from "@/lib/paladin/verification";
import {
  getAcquisitionIntentPlanLabel,
  resolveCoveragePlanSnapshot,
} from "@/lib/paladin/billing/coveragePlan";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import { resolveOrganizationEntitlements } from "@/lib/paladin/entitlements/service";
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
  const isEnterpriseIntent =
    acquisitionIntent?.plan === "ENTERPRISE" ||
    (acquisitionIntent?.plan === "GROWTH" &&
      (acquisitionIntent.employeeCount ?? 0) > 250);
  const verificationStatus =
    organization.verificationPage?.status ??
    (isSubscriptionVerificationActive(subscription?.status)
      ? "verified"
      : "inactive");
  const lifecycle = resolveVerificationLifecycle({
    currentPeriodEnd: subscription?.currentPeriodEnd,
    subscriptionStatus: subscription?.status,
    verificationStatus,
  });
  const checkoutMessage = getCheckoutMessage(params.checkout);
  const portalMessage = getPortalMessage(params.portal);
  const intentMessage =
    params.intent === "saved"
      ? "Plan intent saved. Review billing below to continue with hosted Stripe Checkout."
      : "";

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Billing
        </p>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Coverage and verification status
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
              Billing records determine coverage state for verification and
              module access. Active and trialing coverage publish verified
              status; unresolved billing moves the record into renewal review.
            </p>
          </div>
          <div className="grid gap-3 sm:justify-items-end">
            <SubscriptionEntitlementBadge entitlements={entitlements} />
            <VerificationStatusBadge
              lifecycle={lifecycle}
              status={verificationStatus}
            />
          </div>
        </div>
      </header>

      {checkoutMessage && (
        <section className="rounded-xl border border-blue-300/20 bg-blue-300/10 px-5 py-4 text-sm font-semibold leading-6 text-blue-100">
          {checkoutMessage}
        </section>
      )}

      {intentMessage && (
        <section className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm font-semibold leading-6 text-emerald-100">
          {intentMessage}
        </section>
      )}

      {portalMessage && (
        <section className="rounded-xl border border-blue-300/20 bg-blue-300/10 px-5 py-4 text-sm font-semibold leading-6 text-blue-100">
          {portalMessage}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BillingCard
          label="Coverage"
          value={subscription ? getStatusLabel(subscription.status) : "Not Recorded"}
        />
        <BillingCard
          label="Plan"
          value={planSnapshot.label}
        />
        <BillingCard
          label="Coverage Term"
          value="Annual coverage"
        />
        <BillingCard
          label="Active Through"
          value={formatDisplayDate(subscription?.currentPeriodEnd)}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
        <div className="h-1 bg-gradient-to-r from-transparent via-blue-300 to-amber-200" />
        <div className="grid gap-6 p-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
              Coverage
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Start or manage coverage
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use hosted Stripe Checkout for new coverage. A Stripe customer
              record enables billing portal access for future account
              management.
            </p>
          </div>

          {isEnterpriseIntent ? (
            <EnterpriseBillingContact />
          ) : !acquisitionIntent ? (
            <PlanSelectionNotice
              hasStripeCustomer={Boolean(subscription?.stripeCustomerId)}
            />
          ) : (
            <SubscribeActions
              employeeCount={acquisitionIntent?.employeeCount}
              hasStripeCustomer={Boolean(subscription?.stripeCustomerId)}
              hipaaEnabled={Boolean(acquisitionIntent?.hipaaEnabled)}
              plan={getCheckoutPlan(acquisitionIntent?.plan)}
            />
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 xl:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Coverage Access
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <EntitlementLine
              allowed={entitlements.features.binderPdfGeneration.allowed}
              label="Binder PDF generation"
            />
            <EntitlementLine
              allowed={entitlements.features.downloadableAssets.allowed}
              label="Downloadable assets"
            />
            <EntitlementLine
              allowed={entitlements.features.hipaaAddOn.allowed}
              label="HIPAA add-on"
            />
            <EntitlementLine
              allowed={entitlements.features.verificationModules.allowed}
              label="Verification modules"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Plan Selection
          </p>
          <dl className="mt-5 grid gap-4">
            <BillingDetail
              label="Plan"
              value={
                acquisitionIntent
                  ? getAcquisitionIntentPlanLabel(acquisitionIntent)
                  : "Not selected"
              }
            />
            <BillingDetail
              label="Plan Source"
              value={getPlanSourceLabel(planSnapshot.source)}
            />
            <BillingDetail
              label="Industry"
              value={acquisitionIntent?.industry ?? "Not selected"}
            />
            <BillingDetail
              label="HIPAA Add-on"
              value={acquisitionIntent?.hipaaEnabled ? "Requested" : "No"}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Billing Record
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
              label="Webhook Status"
              value={subscription?.status ?? "No subscription event received"}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-6 xl:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">
            Verification Status Policy
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Organizations without completed coverage appear as NOT YET ACTIVE.
            Active coverage appears as ACTIVE until renewal timing or billing
            state requires review. Records inside the renewal window appear as
            RENEWAL DUE. Coverage no longer maintained after prior activation
            appears as LAPSED.
          </p>
          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Cancel at period end
            </p>
            <p className="mt-2 text-xl font-black text-white">
              {subscription?.cancelAtPeriodEnd ? "Yes" : "No"}
            </p>
          </div>
        </section>
      </section>
    </div>
  );
}

function PlanSelectionNotice({
  hasStripeCustomer,
}: {
  hasStripeCustomer: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <a
        className="inline-flex justify-center rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] transition hover:from-blue-600 hover:to-blue-400"
        href="/pricing"
      >
        Select Annual Coverage
      </a>
      <ManageBillingButton
        disabled={!hasStripeCustomer}
        disabledReason="Billing portal access appears after Stripe creates the customer record."
      />
    </div>
  );
}

function EnterpriseBillingContact() {
  return (
    <div className="rounded-xl border border-amber-200/20 bg-amber-200/[0.07] p-5">
      <p className="text-sm font-black text-amber-100">
        Custom Enterprise Coverage
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Enterprise organizations receive tailored operational coverage based on
        organization size, industry requirements, and deployment scope.
      </p>
      <a
        className="mt-5 inline-flex rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-200/15"
        href="/start/enterprise"
      >
        Contact Sales
      </a>
    </div>
  );
}

function EntitlementLine({
  allowed,
  label,
}: {
  allowed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <span
        className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
          allowed
            ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
            : "border-slate-400/25 bg-slate-400/10 text-slate-300"
        }`}
      >
        {allowed ? "Available" : "Pending Activation"}
      </span>
    </div>
  );
}

function BillingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/90 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-xl font-black capitalize text-white">{value}</p>
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

function getCheckoutMessage(checkout: string | undefined) {
  if (checkout === "success") {
    return "Checkout completed. Paladin will update coverage after Stripe confirms the subscription event.";
  }

  if (checkout === "cancel") {
    return "Checkout was canceled. No billing record was changed.";
  }

  return "";
}

function getPortalMessage(portal: string | undefined) {
  if (portal === "return") {
    return "Returned from Stripe Billing Portal. Paladin will reflect any subscription changes after Stripe sends the related webhook event.";
  }

  return "";
}

function getCheckoutPlan(
  plan: string | null | undefined
): "operational" | "starter" {
  return plan === "GROWTH" ? "operational" : "starter";
}

function getPlanSourceLabel(source: "active_subscription" | "none" | "pending_intent") {
  if (source === "active_subscription") {
    return "Active Stripe subscription";
  }

  if (source === "pending_intent") {
    return "Latest saved plan intent";
  }

  return "No plan selected";
}
