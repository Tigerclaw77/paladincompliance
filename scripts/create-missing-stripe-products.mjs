import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createStripeClient,
  loadExpectedCatalog,
  parseFlags,
  printMode,
} from "./stripe-catalog-utils.mjs";

const flags = parseFlags();
const { mode, stripe } = createStripeClient();
const { entries, pricing, stripeIds } = loadExpectedCatalog();

printMode(mode);
console.log(flags.write ? "Create mode: WRITE" : "Create mode: DRY RUN");

if (flags.write && mode === "live" && !flags.allowLive) {
  throw new Error(
    "Refusing to create live Stripe catalog objects. Re-run with --write --allow-live if this is intentional."
  );
}

if (!flags.write && mode === "live" && !flags.allowLive) {
  console.log("Live mode detected. This dry run will not create anything.");
}

const planned = [];
const skippedExisting = [];
const configurationErrors = [];

for (const item of entries) {
  const productConfigured = isConfiguredProductId(item.productId);
  const priceConfigured = isConfiguredPriceId(item.priceId);

  validatePriceShape(item, configurationErrors);

  if (productConfigured && priceConfigured) {
    skippedExisting.push({
      key: item.key,
      priceId: item.priceId,
      productId: item.productId,
    });
    continue;
  }

  if (!productConfigured && priceConfigured) {
    configurationErrors.push({
      key: item.key,
      message:
        "priceId is configured but productId is missing; refusing to infer product ownership.",
      priceId: item.priceId,
      productId: item.productId,
    });
    continue;
  }

  planned.push({
    amountCents: item.amountCents,
    currency: item.currency,
    employeeRange: item.employeeRange,
    family: item.family,
    hipaa: item.hipaa,
    interval: item.interval ?? "one_time",
    key: item.key,
    missingPrice: !priceConfigured,
    missingProduct: !productConfigured,
    mode: item.mode,
    name: item.displayName,
    productId: productConfigured ? item.productId : null,
  });
}

printInitialSummary({
  configurationErrors,
  planned,
  skippedExisting,
});

if (configurationErrors.length > 0) {
  throw new Error(
    "Stripe mapping configuration has errors. Fix src/lib/stripe/priceIds.ts before creating catalog objects."
  );
}

if (!flags.write) {
  console.log("");
  console.log("Dry run complete. Re-run with --write to create missing Stripe TEST catalog objects.");
  console.log("For live mode writes, also pass --allow-live.");
  process.exit(0);
}

const nextStripeIds = JSON.parse(JSON.stringify(stripeIds));
const createdProducts = [];
const createdPrices = [];
const importedIds = [];

for (const plan of planned) {
  const item = entries.find((entry) => entry.key === plan.key);

  if (!item) {
    throw new Error(`Could not resolve pricing item for ${plan.key}.`);
  }

  let productId = item.productId;

  if (plan.missingProduct) {
    const product = await stripe.products.create(
      {
        metadata: buildStripeMetadata(item),
        name: item.displayName,
      },
      {
        idempotencyKey: `paladin_create_product_${mode}_${item.key}`,
      }
    );

    productId = product.id;
    createdProducts.push({
      id: product.id,
      key: item.key,
      name: product.name,
    });
  }

  if (!isConfiguredProductId(productId)) {
    throw new Error(`Missing product ID for ${item.key}; price was not created.`);
  }

  let priceId = item.priceId;

  if (plan.missingPrice) {
    const price = await stripe.prices.create(
      buildStripePriceCreateParams({
        item,
        productId,
      }),
      {
        idempotencyKey: [
          "paladin_create_price",
          mode,
          item.key,
          item.amountCents,
          item.currency,
          item.interval ?? "one_time",
        ].join("_"),
      }
    );

    priceId = price.id;
    createdPrices.push({
      id: price.id,
      key: item.key,
      productId,
      unitAmount: price.unit_amount,
    });
  }

  nextStripeIds[item.key] = {
    priceId,
    productId,
  };
  importedIds.push({
    key: item.key,
    priceId,
    productId,
  });
}

writeStripePriceIdsFile({
  pricing,
  stripeIds: nextStripeIds,
});

console.log("");
console.log("Created products");
printJson(createdProducts);
console.log("");
console.log("Created prices");
printJson(createdPrices);
console.log("");
console.log("Imported IDs");
printJson(importedIds);
console.log("");
console.log("Updated src/lib/stripe/priceIds.ts.");
console.log("No existing products or prices were renamed, deleted, archived, or repriced.");

function buildStripePriceCreateParams({ item, productId }) {
  const params = {
    currency: item.currency,
    metadata: buildStripeMetadata(item),
    product: productId,
    unit_amount: item.amountCents,
  };

  if (item.mode === "subscription") {
    return {
      ...params,
      recurring: {
        interval: "year",
      },
    };
  }

  return params;
}

function buildStripeMetadata(item) {
  return {
    employee_range: item.employeeRange ?? "none",
    family: item.family,
    hipaa: String(item.hipaa),
    internal_key: item.key,
    mode: item.mode,
  };
}

function isConfiguredProductId(value) {
  return /^prod_[A-Za-z0-9]+$/.test(value ?? "");
}

function isConfiguredPriceId(value) {
  return /^price_[A-Za-z0-9]+$/.test(value ?? "");
}

function validatePriceShape(item, errors) {
  if (item.mode === "subscription" && item.interval !== "year") {
    errors.push({
      key: item.key,
      message: "Subscription pricing must use yearly recurring prices.",
      mode: item.mode,
      interval: item.interval,
    });
  }

  if (item.mode === "payment" && item.interval !== null) {
    errors.push({
      key: item.key,
      message: "Payment pricing must use one-time prices.",
      mode: item.mode,
      interval: item.interval,
    });
  }
}

function printInitialSummary({
  configurationErrors,
  planned,
  skippedExisting,
}) {
  console.log("");
  console.log(`Configured Paladin entries: ${entries.length}`);
  console.log(`Skipped existing items: ${skippedExisting.length}`);
  console.log(`Missing items ${flags.write ? "to create" : "that would be created"}: ${planned.length}`);
  console.log(`Configuration errors: ${configurationErrors.length}`);

  console.log("");
  console.log("Skipped existing items");
  printJson(skippedExisting);

  console.log("");
  console.log(flags.write ? "Creation targets" : "Planned creation targets");
  printJson(planned);

  if (configurationErrors.length > 0) {
    console.log("");
    console.log("Warnings/errors");
    printJson(configurationErrors);
  }
}

function writeStripePriceIdsFile({ pricing, stripeIds }) {
  const outputPath = resolve("src/lib/stripe/priceIds.ts");
  const keys = Object.keys(pricing);
  const body = `import type { PaladinPriceKey } from "@/lib/paladin/pricing";

export type StripePriceMapping = {
  priceId: string;
  productId: string;
};

// Generated from Paladin app-owned pricing. Regenerate missing Stripe TEST IDs with \`npm run stripe:create-missing -- --write\`.
// Stripe remains the payment processor; pricing and plan logic live in src/lib/paladin/pricing.ts.
// Blank mappings mean the app-owned price exists but the matching Stripe Price ID has not been supplied yet.
export const STRIPE_PRICE_IDS = {
${keys.map((key) => `  ${key}: ${formatObject(stripeIds[key] ?? { priceId: "", productId: "" })},`).join("\n")}
} as const satisfies Record<PaladinPriceKey, StripePriceMapping>;
`;

  writeFileSync(outputPath, body);
}

function formatObject(value) {
  const fields = Object.entries(value).map(
    ([key, fieldValue]) => `    ${key}: ${JSON.stringify(fieldValue)}`
  );

  return `{\n${fields.join(",\n")},\n  }`;
}

function printJson(value) {
  if (value.length === 0) {
    console.log("[]");
    return;
  }

  console.log(JSON.stringify(value, null, 2));
}
