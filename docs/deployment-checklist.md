# Paladin Deployment Checklist

## Before Deploy

- Confirm Vercel project is connected to the correct repository and branch.
- Create a Neon Postgres project and database.
- Copy the Neon pooled connection string to `DATABASE_URL`.
- Copy the Neon direct connection string to `DIRECT_URL`.
- Add every required variable from `.env.example`.
- Generate a strong `AUTH_SECRET`.
- Confirm `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` use HTTPS.
- Confirm `PALADIN_ADMIN_EMAILS` includes only internal operators.
- Confirm Resend SMTP credentials are production-ready.
- Confirm Stripe key mode consistency: test/test or live/live.
- Confirm app pricing in `src/lib/paladin/pricing.ts`, then confirm every live selectable coverage tier has Product and Price IDs in `src/lib/stripe/priceIds.ts`.
- If using a Stripe export, confirm `prices.csv` is from the intended Stripe account and run `npm run stripe:price-ids`.
- Run `npm run stripe:audit` and `npm run stripe:export` before production catalog changes.
- Create Stripe webhook endpoint with subscription and invoice events, then set `STRIPE_WEBHOOK_SECRET`.
- Run `npx prisma generate`.
- Run `npx prisma validate`.
- Run `npx prisma migrate deploy` against the production Neon target.
- Decide whether asset storage is pilot-only ephemeral or durable.

## First Deploy Smoke Test

- Visit `/login` and request a magic link.
- Create or access an organization.
- Save Starter and Operational start flow intents.
- Start Stripe Checkout in the intended Stripe mode.
- Send Stripe test webhook events and confirm billing state updates.
- Complete the internal Stripe checklist in `docs/stripe-test-checklist.md`.
- Generate a binder PDF.
- Generate a QR manifest.
- Download assets as an organization member.
- Confirm direct asset download rejects unauthenticated access.
- Confirm `/admin` rejects non-admin users.
- Confirm admin organization detail actions work for an allowlisted admin.
- Confirm `/verify/[slug]` shows active, inactive, and pending renewal states cleanly.

## Go-Live Sequence

1. Deploy with Stripe test keys and the generated test-mode Stripe catalog.
2. Run Prisma migrations against Neon with `npx prisma migrate deploy`.
3. Complete smoke tests using Stripe test webhooks.
4. Configure durable storage or explicitly approve short-lived pilot storage.
5. Switch to live Stripe keys and regenerate the catalog from the live Stripe export.
6. Re-run checkout, webhook, billing portal, asset generation, and verification page smoke tests.
7. Invite the first pilot organization.
