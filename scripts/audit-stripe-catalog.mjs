import {
  buildExpectedProductUpdate,
  createStripeClient,
  diffMetadata,
  diffProductUpdate,
  getExpectedPriceMetadata,
  isPaladinProduct,
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
console.log("Audit mode: read-only");

const [products, prices] = await Promise.all([
  listAllProducts(stripe),
  listAllPrices(stripe),
]);

const expectedProductIds = new Set(entries.map((item) => item.productId));
const expectedPriceIds = new Set(entries.map((item) => item.priceId));
const productsById = new Map(products.map((product) => [product.id, product]));
const pricesById = new Map(prices.map((price) => [price.id, price]));
const activeProducts = products.filter((product) => product.active);
const activePrices = prices.filter((price) => price.active);

const missingProducts = [];
const missingPrices = [];
const namingMismatches = [];
const missingProductMetadata = [];
const missingPriceMetadata = [];

for (const item of entries) {
  const product = productsById.get(item.productId);
  const price = pricesById.get(item.priceId);

  if (!product) {
    missingProducts.push(item);
  } else {
    const productDiff = diffProductUpdate(
      product,
      buildExpectedProductUpdate(item)
    );

    if (productDiff.name || productDiff.description) {
      namingMismatches.push({
        key: item.key,
        product: summarizeProduct(product),
        productDiff,
      });
    }

    if (productDiff.metadata) {
      missingProductMetadata.push({
        key: item.key,
        productId: product.id,
        metadata: productDiff.metadata,
      });
    }
  }

  if (!price) {
    missingPrices.push(item);
  } else {
    const priceMetadataDiff = diffMetadata(
      price.metadata ?? {},
      getExpectedPriceMetadata(item)
    );

    if (Object.keys(priceMetadataDiff).length > 0) {
      missingPriceMetadata.push({
        key: item.key,
        priceId: price.id,
        metadata: priceMetadataDiff,
      });
    }
  }
}

const obsoleteProductCandidates = activeProducts
  .filter((product) => isPaladinProduct(product))
  .filter((product) => !expectedProductIds.has(product.id))
  .map(summarizeProduct);
const activePaladinProducts = activeProducts
  .filter((product) => isPaladinProduct(product))
  .map(summarizeProduct);
const obsoletePriceCandidates = activePrices
  .filter((price) => !expectedPriceIds.has(price.id))
  .filter((price) => {
    const productId =
      typeof price.product === "string" ? price.product : price.product?.id;
    const product = productId ? productsById.get(productId) : null;

    return Boolean(product && isPaladinProduct(product));
  })
  .map(summarizePrice);
const activePaladinPrices = activePrices
  .filter((price) => {
    const productId =
      typeof price.product === "string" ? price.product : price.product?.id;
    const product = productId ? productsById.get(productId) : null;

    return Boolean(product && isPaladinProduct(product));
  })
  .map(summarizePrice);

printSummary({
  activePaladinPrices,
  activePaladinProducts,
  activePrices,
  activeProducts,
  missingPriceMetadata,
  missingPrices,
  missingProductMetadata,
  missingProducts,
  namingMismatches,
  obsoletePriceCandidates,
  obsoleteProductCandidates,
  prices,
  products,
});

function printSummary({
  activePaladinPrices,
  activePaladinProducts,
  activePrices,
  activeProducts,
  missingPriceMetadata,
  missingPrices,
  missingProductMetadata,
  missingProducts,
  namingMismatches,
  obsoletePriceCandidates,
  obsoleteProductCandidates,
  prices,
  products,
}) {
  console.log("");
  console.log("Stripe catalog audit summary");
  console.log(`- Products fetched: ${products.length}`);
  console.log(`- Active products: ${activeProducts.length}`);
  console.log(`- Active Paladin products: ${activePaladinProducts.length}`);
  console.log(`- Prices fetched: ${prices.length}`);
  console.log(`- Active prices: ${activePrices.length}`);
  console.log(`- Active Paladin prices: ${activePaladinPrices.length}`);
  console.log(`- Configured Paladin entries: ${entries.length}`);
  console.log(`- Missing configured products: ${missingProducts.length}`);
  console.log(`- Missing configured prices: ${missingPrices.length}`);
  console.log(`- Naming/description mismatches: ${namingMismatches.length}`);
  console.log(`- Product metadata findings: ${missingProductMetadata.length}`);
  console.log(`- Price metadata findings: ${missingPriceMetadata.length}`);
  console.log(`- Obsolete product candidates: ${obsoleteProductCandidates.length}`);
  console.log(`- Obsolete price candidates: ${obsoletePriceCandidates.length}`);

  printFindings("Active Paladin products", activePaladinProducts);
  printFindings("Active Paladin prices", activePaladinPrices);
  printFindings("Missing configured products", missingProducts);
  printFindings("Missing configured prices", missingPrices);
  printFindings("Naming/description mismatches", namingMismatches);
  printFindings("Product metadata findings", missingProductMetadata);
  printFindings("Price metadata findings", missingPriceMetadata);
  printFindings("Obsolete product candidates", obsoleteProductCandidates);
  printFindings("Obsolete price candidates", obsoletePriceCandidates);

  console.log("");
  console.log("No products or prices were changed.");
}

function printFindings(title, findings) {
  if (findings.length === 0) {
    return;
  }

  console.log("");
  console.log(title);
  console.log(JSON.stringify(findings, null, 2));
}
