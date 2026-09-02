import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Stripe from "stripe";

export function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const equalsIndex = trimmedLine.indexOf("=");

      if (equalsIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, equalsIndex).trim();
      const value = unquoteEnvValue(trimmedLine.slice(equalsIndex + 1).trim());

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

export function createStripeClient() {
  loadLocalEnv();

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Set it in the environment or local env file before running this script."
    );
  }

  const mode = getStripeKeyMode(secretKey);

  if (!mode) {
    throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  }

  return {
    mode,
    stripe: new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
      appInfo: {
        name: "Paladin Compliance catalog maintenance",
        version: "0.1.0",
      },
    }),
  };
}

export function printMode(mode) {
  console.log(`Stripe mode: ${mode.toUpperCase()}`);
}

export function parseFlags(argv = process.argv.slice(2)) {
  return {
    allowLive: argv.includes("--allow-live"),
    write: argv.includes("--write"),
  };
}

export function loadExpectedCatalog() {
  const pricing = loadExportedObject({
    exportName: "PALADIN_PRICING",
    filePath: "src/lib/paladin/pricing.ts",
  });
  const stripeIds = loadExportedObject({
    exportName: "STRIPE_PRICE_IDS",
    filePath: "src/lib/stripe/priceIds.ts",
  });
  const entries = Object.entries(pricing).map(([key, item]) => {
    const stripeMapping = stripeIds[key];

    if (!stripeMapping) {
      throw new Error(`Missing Stripe ID mapping for pricing key "${key}".`);
    }

    return {
      ...item,
      ...stripeMapping,
      key,
    };
  });

  return {
    entries,
    pricing,
    stripeIds,
  };
}

export async function listAllProducts(stripe) {
  return listAll((params) => stripe.products.list(params));
}

export async function listAllPrices(stripe) {
  return listAll((params) => stripe.prices.list(params));
}

export function buildExpectedProductUpdate(item) {
  return {
    description: getExpectedProductDescription(item),
    metadata: getExpectedProductMetadata(item),
    name: item.displayName,
  };
}

export function getExpectedProductMetadata(item) {
  return {
    paladin_family: item.family,
    paladin_hipaa: String(item.hipaa),
    paladin_interval: item.interval ?? "one_time",
    paladin_managed: "true",
    paladin_plan: item.plan,
    paladin_price_key: item.key,
    paladin_visibility: item.visibility,
  };
}

export function getExpectedPriceMetadata(item) {
  return {
    paladin_amount_cents: String(item.amountCents),
    paladin_currency: item.currency,
    paladin_family: item.family,
    paladin_interval: item.interval ?? "one_time",
    paladin_price_key: item.key,
    paladin_price_mapping: "true",
  };
}

export function diffProductUpdate(product, expectedUpdate) {
  const changes = {};

  if (product.name !== expectedUpdate.name) {
    changes.name = {
      actual: product.name ?? "",
      expected: expectedUpdate.name,
    };
  }

  if ((product.description ?? "") !== expectedUpdate.description) {
    changes.description = {
      actual: product.description ?? "",
      expected: expectedUpdate.description,
    };
  }

  const metadataChanges = diffMetadata(
    product.metadata ?? {},
    expectedUpdate.metadata
  );

  if (Object.keys(metadataChanges).length > 0) {
    changes.metadata = metadataChanges;
  }

  return changes;
}

export function diffMetadata(actualMetadata, expectedMetadata) {
  return Object.fromEntries(
    Object.entries(expectedMetadata)
      .filter(([key, expectedValue]) => actualMetadata[key] !== expectedValue)
      .map(([key, expectedValue]) => [
        key,
        {
          actual: actualMetadata[key] ?? "",
          expected: expectedValue,
        },
      ])
  );
}

export function summarizePrice(price) {
  return {
    active: price.active,
    currency: price.currency,
    id: price.id,
    interval: price.recurring?.interval ?? null,
    livemode: price.livemode,
    product: typeof price.product === "string" ? price.product : price.product?.id,
    type: price.type,
    unit_amount: price.unit_amount,
  };
}

export function summarizeProduct(product) {
  return {
    active: product.active,
    description: product.description ?? null,
    id: product.id,
    livemode: product.livemode,
    metadata: product.metadata ?? {},
    name: product.name,
  };
}

export function ensureDirectory(path) {
  mkdirSync(dirname(path), {
    recursive: true,
  });
}

export function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function isPaladinProduct(product) {
  const metadata = product.metadata ?? {};

  return (
    metadata.paladin_managed === "true" ||
    Boolean(metadata.paladin_price_key) ||
    product.name.toLowerCase().includes("paladin")
  );
}

async function listAll(listPage) {
  const records = [];
  let startingAfter;

  for (;;) {
    const page = await listPage({
      limit: 100,
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

function getExpectedProductDescription(item) {
  if (item.family === "coverage") {
    return `Paladin Compliance annual coverage for ${item.displayName}.`;
  }

  if (item.visibility === "active_coverage") {
    return "Additional or replacement physical binder for active Paladin Compliance members.";
  }

  return "Physical Paladin Compliance binder package.";
}

function loadExportedObject({ exportName, filePath }) {
  const absolutePath = resolve(filePath);
  const source = readFileSync(absolutePath, "utf8");
  const marker = `export const ${exportName} = `;
  const markerIndex = source.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Could not find ${exportName} in ${filePath}.`);
  }

  const objectStart = source.indexOf("{", markerIndex);
  const objectEnd = findMatchingBrace(source, objectStart);
  const objectText = source.slice(objectStart, objectEnd + 1);

  return Function(`"use strict"; return (${objectText});`)();
}

function findMatchingBrace(source, startIndex) {
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        inString = false;
      }

      continue;
    }

    if (character === "\"" || character === "'" || character === "`") {
      inString = true;
      quote = character;
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error("Could not parse exported object literal.");
}

function getStripeKeyMode(secretKey) {
  if (secretKey.startsWith("sk_live_")) {
    return "live";
  }

  if (secretKey.startsWith("sk_test_")) {
    return "test";
  }

  return "";
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
