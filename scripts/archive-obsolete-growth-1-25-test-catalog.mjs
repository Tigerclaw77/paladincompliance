import {
  createStripeClient,
  listAllPrices,
  listAllProducts,
  loadExpectedCatalog,
  parseFlags,
  printMode,
  summarizePrice,
  summarizeProduct,
} from "./stripe-catalog-utils.mjs";

const obsoleteTargets = [
  {
    legacyKey: "growth1To25",
    priceId: "price_1TUvfcJWAlqh6e3YoPYyApn5",
    productId: "prod_UTtSHArnshNfpG",
    productName: "Paladin Growth 1-25",
  },
  {
    legacyKey: "growth1To25Hipaa",
    priceId: "price_1TUvpSJWAlqh6e3YFScTt2KC",
    productId: "prod_UTtcDm73Y2fQI2",
    productName: "Paladin Growth 1-25 + HIPAA",
  },
];
const blockingSubscriptionStatuses = new Set([
  "active",
  "incomplete",
  "past_due",
  "trialing",
  "unpaid",
]);

const flags = parseFlags();
const { mode, stripe } = createStripeClient();
const { entries } = loadExpectedCatalog();

printMode(mode);
console.log(flags.write ? "Archive mode: WRITE" : "Archive mode: DRY RUN");

if (mode === "live") {
  throw new Error("Refusing to archive live Stripe catalog objects.");
}

const [products, prices, subscriptions] = await Promise.all([
  listAllProducts(stripe),
  listAllPrices(stripe),
  listAllSubscriptions(stripe),
]);
const mappedIds = new Set(
  entries.flatMap((entry) => [entry.productId, entry.priceId]).filter(Boolean)
);
const productsById = new Map(products.map((product) => [product.id, product]));
const pricesById = new Map(prices.map((price) => [price.id, price]));
const referencedSubscriptions = findReferencedSubscriptions(subscriptions);
const blockingSubscriptions = referencedSubscriptions.filter((subscription) =>
  blockingSubscriptionStatuses.has(subscription.status)
);
const archiveTargets = [];
const retainedTargets = [];

for (const target of obsoleteTargets) {
  const product = productsById.get(target.productId);
  const price = pricesById.get(target.priceId);
  const productMapped = mappedIds.has(target.productId);
  const priceMapped = mappedIds.has(target.priceId);
  const productMatches = product?.name === target.productName;
  const priceMatchesProduct =
    typeof price?.product === "string"
      ? price.product === target.productId
      : price?.product?.id === target.productId;

  if (!product || !price) {
    retainedTargets.push({
      ...target,
      reason: "Target product or price was not found in Stripe TEST catalog.",
    });
    continue;
  }

  if (product.livemode || price.livemode) {
    retainedTargets.push({
      ...target,
      reason: "Target is not a TEST-mode product/price.",
    });
    continue;
  }

  if (productMapped || priceMapped) {
    retainedTargets.push({
      ...target,
      priceMapped,
      productMapped,
      reason: "Target is still referenced by current app Stripe mappings.",
    });
    continue;
  }

  if (!productMatches || !priceMatchesProduct) {
    retainedTargets.push({
      ...target,
      productNameActual: product.name,
      productMatches,
      priceMatchesProduct,
      reason: "Target identity did not match the expected obsolete Growth 1-25 object.",
    });
    continue;
  }

  if (!product.active && !price.active) {
    retainedTargets.push({
      ...target,
      reason: "Target product and price are already archived.",
    });
    continue;
  }

  const activeBlockingSubscriptions = blockingSubscriptions.filter((subscription) =>
    subscription.priceIds.includes(target.priceId)
  );

  if (activeBlockingSubscriptions.length > 0) {
    retainedTargets.push({
      ...target,
      activeBlockingSubscriptions,
      reason: "Target price is still referenced by a current Stripe subscription.",
    });
    continue;
  }

  archiveTargets.push({
    legacyKey: target.legacyKey,
    price: summarizePrice(price),
    product: summarizeProduct(product),
    referencedSubscriptions: referencedSubscriptions.filter((subscription) =>
      subscription.priceIds.includes(target.priceId)
    ),
  });
}

printReport({
  archiveTargets,
  blockingSubscriptions,
  retainedTargets,
});

if (!flags.write) {
  console.log("");
  console.log("Dry run complete. Re-run with --write to archive the listed TEST-mode obsolete Growth 1-25 objects.");
  process.exit(0);
}

const archivedProducts = [];
const archivedPrices = [];
const archiveErrors = [];

for (const target of archiveTargets) {
  if (target.product.active) {
    console.log("");
    console.log(
      `MUTATION: stripe.products.update("${target.product.id}", { active: false })`
    );
    try {
      const product = await stripe.products.update(target.product.id, {
        active: false,
      });
      archivedProducts.push(summarizeProduct(product));
    } catch (error) {
      archiveErrors.push({
        id: target.product.id,
        kind: "product",
        message: error instanceof Error ? error.message : "Product archive failed",
      });
      continue;
    }
  }

  if (target.price.active) {
    console.log("");
    console.log(
      `MUTATION: stripe.prices.update("${target.price.id}", { active: false })`
    );
    try {
      const price = await stripe.prices.update(target.price.id, {
        active: false,
      });
      archivedPrices.push(summarizePrice(price));
    } catch (error) {
      archiveErrors.push({
        id: target.price.id,
        kind: "price",
        message: error instanceof Error ? error.message : "Price archive failed",
      });
    }
  }
}

console.log("");
console.log("Archived prices");
printJson(archivedPrices);
console.log("");
console.log("Archived products");
printJson(archivedProducts);
console.log("");
console.log("Archive warnings/errors");
printJson(archiveErrors);
console.log("");
console.log("No prices were repriced. No products or prices were deleted.");

async function listAllSubscriptions(stripeClient) {
  const records = [];
  let startingAfter;

  for (;;) {
    const page = await stripeClient.subscriptions.list({
      limit: 100,
      status: "all",
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    records.push(...page.data);

    if (!page.has_more) {
      return records;
    }

    startingAfter = page.data.at(-1)?.id;

    if (!startingAfter) {
      return records;
    }
  }
}

function findReferencedSubscriptions(subscriptions) {
  const obsoletePriceIds = new Set(obsoleteTargets.map((target) => target.priceId));

  return subscriptions
    .map((subscription) => ({
      id: subscription.id,
      priceIds: subscription.items.data
        .map((item) => item.price?.id)
        .filter(Boolean),
      status: subscription.status,
    }))
    .filter((subscription) =>
      subscription.priceIds.some((priceId) => obsoletePriceIds.has(priceId))
    );
}

function printReport({
  archiveTargets,
  blockingSubscriptions,
  retainedTargets,
}) {
  console.log("");
  console.log(`Current app mapped Stripe IDs checked: ${mappedIds.size}`);
  console.log(`Obsolete Growth 1-25 targets checked: ${obsoleteTargets.length}`);
  console.log(`Subscriptions referencing obsolete prices: ${referencedSubscriptions.length}`);
  console.log(`Blocking current subscriptions: ${blockingSubscriptions.length}`);
  console.log(`Archive targets ${flags.write ? "to execute" : "that would execute"}: ${archiveTargets.length}`);
  console.log(`Retained targets: ${retainedTargets.length}`);

  console.log("");
  console.log("Archive targets");
  printJson(archiveTargets);

  console.log("");
  console.log("Retained targets");
  printJson(retainedTargets);

  console.log("");
  console.log("Retained compatibility aliases");
  printJson([
    { legacyKey: "growth1To25", resolvesTo: "starter" },
    { legacyKey: "growth1To25Hipaa", resolvesTo: "starterHipaa" },
  ]);
}

function printJson(value) {
  if (value.length === 0) {
    console.log("[]");
    return;
  }

  console.log(JSON.stringify(value, null, 2));
}
