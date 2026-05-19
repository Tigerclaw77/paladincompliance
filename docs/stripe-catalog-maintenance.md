# Stripe Catalog Maintenance

Paladin keeps pricing and plan structure in application code. Stripe is used as
the payment processor and subscription ledger. These scripts never derive MVP
business logic from Stripe products.

## Source of Truth

- Pricing and plan structure: `src/lib/paladin/pricing.ts`
- Stripe Product and Price ID mapping: `src/lib/stripe/priceIds.ts`
- Stripe ID export input: `prices.csv`

## Safe Commands

Audit the configured Stripe account without changing anything:

```bash
npm run stripe:audit
```

Export a read-only JSON snapshot into `stripe-snapshots/`:

```bash
npm run stripe:export
```

Preview product metadata/name/description changes:

```bash
npm run stripe:sync
```

Preview missing Stripe catalog objects that would be created from app-owned
pricing:

```bash
npm run stripe:create-missing
```

Create missing Stripe TEST products/prices and import the created IDs into
`src/lib/stripe/priceIds.ts`:

```bash
npm run stripe:create-missing -- --write
```

Apply product metadata/name/description changes in test mode:

```bash
npm run stripe:sync -- --write
```

Live mode writes are blocked unless both write flags are explicit:

```bash
npm run stripe:sync -- --write --allow-live
npm run stripe:create-missing -- --write --allow-live
```

Regenerate Stripe ID mappings after exporting `prices.csv` from the intended
Stripe account:

```bash
npm run stripe:price-ids
```

## Production Catalog Completion

The application-owned public coverage catalog is:

| App key | Stripe product name | Price | Billing |
| --- | --- | ---: | --- |
| `starter` | `Paladin Starter` | `$499` | yearly recurring |
| `starterHipaa` | `Paladin Starter + HIPAA` | `$699` | yearly recurring |
| `operational26To50` | `Paladin Operational 26-50` | `$1,499` | yearly recurring |
| `operational26To50Hipaa` | `Paladin Operational 26-50 + HIPAA` | `$2,099` | yearly recurring |
| `operational51To100` | `Paladin Operational 51-100` | `$2,499` | yearly recurring |
| `operational51To100Hipaa` | `Paladin Operational 51-100 + HIPAA` | `$3,499` | yearly recurring |
| `operational101To250` | `Paladin Operational 101-250` | `$4,999` | yearly recurring |
| `operational101To250Hipaa` | `Paladin Operational 101-250 + HIPAA` | `$6,999` | yearly recurring |

Enterprise is contact sales only. Do not create Enterprise Stripe products or
Prices.

If the live Stripe catalog is missing the higher Operational tiers, create
these four Products in live mode:

- `Paladin Operational 51-100`: `$2,499`, USD, recurring yearly.
- `Paladin Operational 51-100 + HIPAA`: `$3,499`, USD, recurring yearly.
- `Paladin Operational 101-250`: `$4,999`, USD, recurring yearly.
- `Paladin Operational 101-250 + HIPAA`: `$6,999`, USD, recurring yearly.

After creation, paste the live Product and Price IDs into
`src/lib/stripe/priceIds.ts`:

- `STRIPE_PRICE_IDS.operational51To100.productId` and `.priceId`
- `STRIPE_PRICE_IDS.operational51To100Hipaa.productId` and `.priceId`
- `STRIPE_PRICE_IDS.operational101To250.productId` and `.priceId`
- `STRIPE_PRICE_IDS.operational101To250Hipaa.productId` and `.priceId`

Use the Stripe Dashboard "Copy price ID" action for each Price. Also copy each
Product ID from the Product details page so checkout metadata and catalog audits
remain complete.

## Safety Rules

- `STRIPE_SECRET_KEY` is required and the scripts print whether the key is test
  or live mode.
- `stripe:sync` is dry-run by default.
- `stripe:create-missing` is dry-run by default and only creates app-defined
  products/prices that have blank Stripe ID mappings.
- `stripe:sync -- --write` updates only Product `name`, `description`, and
  `metadata`.
- `stripe:create-missing -- --write` creates only missing Products and Prices
  from `src/lib/paladin/pricing.ts`, then imports the resulting IDs into
  `src/lib/stripe/priceIds.ts`.
- Price amounts are never changed by these scripts.
- Products are never deleted.
- Products are never archived automatically.
- Live mode is never mutated unless `--write --allow-live` are both provided.
