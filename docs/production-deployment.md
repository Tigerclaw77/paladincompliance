# Paladin Production Deployment

This app is prepared for Vercel deployment with explicit runtime validation for auth, Stripe, email, admin access, site URL, and storage configuration.

Production database support is standardized on hosted Postgres. The recommended low-cost setup is Vercel + Neon Postgres + Resend SMTP + Stripe Checkout.

## Required Vercel Environment Variables

Set the values from `.env.example` in Vercel Project Settings.

Minimum production requirements:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `DATABASE_URL`
- `EMAIL_SERVER`
- `EMAIL_FROM`
- `PALADIN_ADMIN_EMAILS`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

Stripe secret and publishable keys must both be test mode or both be live mode.

Pricing and plan structure are managed in `src/lib/paladin/pricing.ts`. Stripe
Product and Price IDs are isolated in `src/lib/stripe/priceIds.ts`. Regenerate
the ID map after a Stripe export changes:

```bash
npm run stripe:price-ids
```

Recommended optional variables:

- `DIRECT_URL`
- `EMAIL_REPLY_TO`
- `PALADIN_SUPPORT_EMAIL`
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

## Measurement And Search

The app emits baseline canonical, Open Graph, Twitter/X, and JSON-LD metadata
from `src/app/layout.tsx`. Production also supports optional analytics scripts
through public Vercel environment variables:

- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog project key.
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog ingestion host, normally `https://us.i.posthog.com`.
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`: Microsoft Clarity project ID.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: GA4 measurement ID, for example `G-XXXXXXXXXX`.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: Google Search Console meta verification token.

Configure these in Vercel at Project Settings > Environment Variables, then
redeploy production so Next.js can include the public values in the client
bundle.

Catalog maintenance is dry-run first. See
`docs/stripe-catalog-maintenance.md` for details:

```bash
npm run stripe:audit
npm run stripe:export
npm run stripe:sync
npm run stripe:sync -- --write
```

## Neon Postgres

Create a Neon project and database for Paladin. In Vercel, set:

- `DATABASE_URL`: Neon pooled connection string, used by the app runtime.
- `DIRECT_URL`: Neon direct connection string, used by Prisma migration and maintenance commands when available.

Both URLs should use SSL, for example:

```txt
postgresql://user:password@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
postgresql://user:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Apply migrations before routing real users to the deployment:

```bash
npm ci
npx prisma generate
npx prisma validate
npx prisma migrate deploy
npm run build
```

The Prisma config uses `DIRECT_URL` for migrations when it is present and falls back to `DATABASE_URL`.

## Local Development Database

The primary Prisma schema now targets Postgres. Local SQLite is no longer supported by the active schema or migrations.

For the lowest-friction local workflow, create a Neon development branch and put its pooled URL in local `DATABASE_URL`. Put the branch direct URL in `DIRECT_URL` when running migrations locally.

Alternative local development is a local Postgres server using:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/paladincompliance?schema=public
```

## Storage Policy

The current storage adapter supports:

- `local`: filesystem storage for local development.
- `vercel-tmp`: Vercel `/tmp` filesystem storage for short-lived pilot testing.
- `s3` and `r2`: reserved configuration targets for future durable adapters.

Production boot validation blocks `local` and `vercel-tmp` unless:

```txt
PALADIN_ALLOW_EPHEMERAL_STORAGE=true
```

Use that exception only for pilot testing where generated assets can be regenerated. Before public launch, connect a durable S3/R2 adapter.

## Stripe Webhooks

Create a Stripe webhook endpoint:

```txt
https://your-domain.com/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Set the signing secret as `STRIPE_WEBHOOK_SECRET`.

The app stores processed Stripe event IDs in `StripeWebhookEvent` to avoid duplicate event processing. Invoice events resync the related subscription so payment recovery and payment failure states converge even if subscription update delivery is delayed.

## Stripe Test and Live Mode

Deploy first with Stripe test keys and test recurring Price IDs:

- `STRIPE_SECRET_KEY=sk_test_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`

Before switching to live mode, replace all Stripe keys and regenerate the
catalog from the live Stripe product/price export. Do not mix test keys with
live Price IDs. Checkout performs a runtime Stripe Price lookup and blocks
catalog items whose Stripe livemode does not match the configured key mode.

## Vercel Build and Migration Commands

Recommended Vercel build command:

```bash
npx prisma generate && npm run build
```

Run migrations from a trusted environment with the same Neon env vars:

```bash
npx prisma migrate deploy
```

## Email

Auth.js magic-link login uses `EMAIL_SERVER` and `EMAIL_FROM`. For Resend SMTP, use:

```txt
EMAIL_SERVER=smtps://resend:re_your_api_key@smtp.resend.com:465
EMAIL_FROM=Paladin Compliance <security@your-domain.com>
```

`EMAIL_REPLY_TO` and `PALADIN_SUPPORT_EMAIL` should point to an inbox monitored by the operator.

## Security Headers

`next.config.ts` applies baseline security headers:

- Content Security Policy
- Frame protection
- Content sniffing protection
- Referrer policy
- Permissions policy

The CSP intentionally stays simple and allows Stripe.js.
