import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createStripeClient,
  ensureDirectory,
  getTimestamp,
  listAllPrices,
  listAllProducts,
  loadExpectedCatalog,
  printMode,
  summarizePrice,
  summarizeProduct,
} from "./stripe-catalog-utils.mjs";

const { mode, stripe } = createStripeClient();
const { entries } = loadExpectedCatalog();

printMode(mode);
console.log("Export mode: read-only");

const [products, prices] = await Promise.all([
  listAllProducts(stripe),
  listAllPrices(stripe),
]);
const snapshotPath = resolve(
  "stripe-snapshots",
  `stripe-catalog-${mode}-${getTimestamp()}.json`
);
const snapshot = {
  expectedCatalog: entries.map((item) => ({
    amountCents: item.amountCents,
    displayName: item.displayName,
    family: item.family,
    key: item.key,
    priceId: item.priceId,
    productId: item.productId,
  })),
  exportedAt: new Date().toISOString(),
  mode,
  prices: prices.map(summarizePrice),
  products: products.map(summarizeProduct),
};

ensureDirectory(snapshotPath);
writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);

console.log("");
console.log(`Wrote Stripe catalog snapshot: ${snapshotPath}`);
console.log(`Products exported: ${products.length}`);
console.log(`Prices exported: ${prices.length}`);
console.log("No products or prices were changed.");
