import {
  buildExpectedProductUpdate,
  createStripeClient,
  diffProductUpdate,
  listAllPrices,
  listAllProducts,
  loadExpectedCatalog,
  parseFlags,
  printMode,
} from "./stripe-catalog-utils.mjs";

const flags = parseFlags();
const { mode, stripe } = createStripeClient();
const { entries } = loadExpectedCatalog();

printMode(mode);
console.log(flags.write ? "Sync mode: WRITE" : "Sync mode: DRY RUN");

if (flags.write && mode === "live" && !flags.allowLive) {
  throw new Error(
    "Refusing to mutate live Stripe catalog. Re-run with --write --allow-live if this is intentional."
  );
}

const [products, prices] = await Promise.all([
  listAllProducts(stripe),
  listAllPrices(stripe),
]);
const productsById = new Map(products.map((product) => [product.id, product]));
const pricesById = new Map(prices.map((price) => [price.id, price]));
const updates = [];
const missingProducts = [];
const missingPrices = [];

for (const item of entries) {
  const product = productsById.get(item.productId);
  const price = pricesById.get(item.priceId);

  if (!product) {
    missingProducts.push({
      key: item.key,
      productId: item.productId,
    });
    continue;
  }

  if (!price) {
    missingPrices.push({
      key: item.key,
      priceId: item.priceId,
    });
  }

  const expectedUpdate = buildExpectedProductUpdate(item);
  const changes = diffProductUpdate(product, expectedUpdate);

  if (Object.keys(changes).length > 0) {
    updates.push({
      changes,
      expectedUpdate,
      key: item.key,
      productId: product.id,
    });
  }
}

console.log("");
console.log(`Configured Paladin entries: ${entries.length}`);
console.log(`Product updates ${flags.write ? "to apply" : "that would apply"}: ${updates.length}`);
console.log(`Missing configured products: ${missingProducts.length}`);
console.log(`Missing configured prices: ${missingPrices.length}`);

if (missingProducts.length > 0) {
  console.log("");
  console.log("Missing products");
  console.log(JSON.stringify(missingProducts, null, 2));
}

if (missingPrices.length > 0) {
  console.log("");
  console.log("Missing prices");
  console.log(JSON.stringify(missingPrices, null, 2));
}

if (updates.length > 0) {
  console.log("");
  console.log(flags.write ? "Applying product updates" : "Planned product updates");
  console.log(
    JSON.stringify(
      updates.map(({ changes, key, productId }) => ({
        changes,
        key,
        productId,
      })),
      null,
      2
    )
  );
}

if (flags.write) {
  for (const update of updates) {
    await stripe.products.update(update.productId, update.expectedUpdate);
    console.log(`Updated product ${update.productId} (${update.key})`);
  }

  console.log("");
  console.log("Sync complete. No prices were changed, deleted, or archived.");
} else {
  console.log("");
  console.log("Dry run complete. Re-run with --write to update product names, descriptions, and metadata.");
  console.log("For live mode writes, also pass --allow-live.");
}
