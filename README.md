This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Stripe Checkout

Hosted subscription checkout expects these environment variables:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_BILLING_PORTAL_CONFIGURATION_ID=bpc_... # optional
```

Pricing and plan structure are centralized in `src/lib/paladin/pricing.ts`.
Stripe Product and Price IDs are isolated in `src/lib/stripe/priceIds.ts`,
generated from the root `prices.csv` export with `npm run stripe:price-ids`.
Safe catalog maintenance commands are documented in
`docs/stripe-catalog-maintenance.md`:

```bash
npm run stripe:audit
npm run stripe:export
npm run stripe:sync
npm run stripe:sync -- --write
```

Stripe webhooks should point to `/api/stripe/webhook` and include subscription
events such as `checkout.session.completed`,
`customer.subscription.created`, `customer.subscription.updated`, and
`customer.subscription.deleted`.

## Local Auth and Database

Paladin uses Prisma with Postgres and Auth.js magic-link email sign-in. For
low-cost local development, use a Neon development branch or a local Postgres
database.

```bash
DATABASE_URL=postgresql://user:password@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EMAIL_SERVER=smtp://localhost:1025
EMAIL_FROM="Paladin Compliance <security@paladincompliance.com>"
```

Run migrations with:

```bash
npm run db:migrate
```

For production or preview deploys, use:

```bash
npx prisma migrate deploy
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
