# Paladin Stripe Test Checklist

Use this checklist before promoting a Stripe catalog or deployment. Run it once with test keys/catalog data and again after switching to live keys/catalog data.

## Preconditions

- `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are both test mode or both live mode.
- `src/lib/paladin/pricing.ts` reflects the intended MVP pricing and plan structure.
- `prices.csv` was exported from the same Stripe account/mode as the configured keys when using the CSV import helper.
- `npm run stripe:price-ids` has regenerated `src/lib/stripe/priceIds.ts`.
- All selectable coverage keys have real Stripe Product and Price IDs in `src/lib/stripe/priceIds.ts` before checkout testing:
  - `starter`
  - `starterHipaa`
  - `operational26To50`
  - `operational26To50Hipaa`
  - `operational51To100`
  - `operational51To100Hipaa`
  - `operational101To250`
  - `operational101To250Hipaa`
- `npm run stripe:audit` reports no unexpected missing configured products or prices.
- Webhook endpoint is configured for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- `STRIPE_WEBHOOK_SECRET` matches the endpoint receiving events.
- Billing Portal is configured in Stripe and `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` is set when using a non-default portal configuration.

## Coverage Checkout

- Starter:
  - Select Starter in `/pricing`.
  - Complete `/start/starter` with a non-Healthcare industry.
  - Confirm `/dashboard/billing` shows `Starter` from latest saved plan intent.
  - Start Checkout and confirm Stripe shows the Starter annual price.
  - Complete payment and confirm the webhook updates subscription status to `active`.

- Starter + HIPAA:
  - Select Starter.
  - Choose Healthcare and enable HIPAA coverage.
  - Confirm the selected plan shows `Starter + HIPAA`.
  - Complete Checkout and confirm public verification displays HIPAA active only after subscription is active.

- Operational tier:
  - Select Operational and test employee counts in each tier:
    - `40` employees: Operational (26-50 staff).
    - `80` employees: Operational (51-100 staff).
    - `180` employees: Operational (101-250 staff).
  - Confirm Stripe Checkout uses the matching catalog price.
  - Confirm switching Operational to Starter updates the dashboard immediately before checkout.

- Enterprise handoff:
  - Enter `251` employees.
  - Confirm self-checkout is blocked and the CTA is Contact Sales.
  - Confirm direct checkout API manipulation returns an error.

## Subscription Lifecycle

- Active:
  - Complete Checkout successfully.
  - Confirm `customer.subscription.created` or `customer.subscription.updated` sets status to `active`.
  - Confirm verification status becomes active/verified.

- Trialing:
  - Send or create a trialing subscription event.
  - Confirm entitlements treat `trialing` like active.

- Incomplete:
  - Use a payment flow that leaves the subscription `incomplete`.
  - Confirm dashboard shows the latest acquisition intent as plan source and locks premium actions.

- Past due / unpaid:
  - Trigger `invoice.payment_failed`.
  - Confirm webhook logs the invoice event and resyncs the Stripe subscription.
  - Confirm verification moves to pending renewal when Stripe status is `past_due` or `unpaid`.

- Canceled:
  - Cancel through Stripe Billing Portal or Stripe Dashboard.
  - Confirm `customer.subscription.deleted` marks subscription canceled and verification inactive.

## Billing Portal

- Open the Billing Portal from `/dashboard/billing`.
- Update payment method and return to Paladin.
- Confirm return URL is `/dashboard/billing?portal=return`.
- Confirm the dashboard message explains that Stripe webhooks finalize state.
- Cancel subscription in the portal and verify webhook behavior.

## Webhook Replay and Idempotency

- Replay `checkout.session.completed` from the Stripe Dashboard or Stripe CLI.
- Replay `customer.subscription.updated`.
- Replay `invoice.paid`.
- Confirm duplicate event IDs return successfully without reprocessing.
- Confirm logs include event ID, event type, org ID when available, subscription ID, and resulting status.

## Additional Binder Access

- With no active subscription, attempt to purchase an Additional Binder.
- Confirm checkout is blocked.
- With active coverage, purchase an Additional Binder.
- Confirm one-time Checkout succeeds and asset/binder messaging remains separate from subscription entitlement state.

## Operational Log Review

Confirm logs are present for:

- `stripe_checkout_requested`
- `stripe_checkout_session_created`
- `stripe_webhook_received`
- `stripe_webhook_processing_started`
- `stripe_webhook_processing_completed`
- `stripe_subscription_state_synced`
- `paladin_entitlement_state_updated`
- `stripe_portal_session_created`
- `stripe_catalog_price_mode_validated`

No log entry should include API keys, webhook secrets, payment method details, or full card/customer financial data.
