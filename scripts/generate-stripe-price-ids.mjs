import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const productKeyMap = new Map([
  ["Paladin Additional Binder", "additionalBinder"],
  ["Paladin Additional Binder + HIPAA", "additionalBinderHipaa"],
  ["Paladin Compliance Binder", "complianceBinder"],
  ["Paladin Compliance Binder + HIPAA", "complianceBinderHipaa"],
  ["Paladin Operational 26-50", "operational26To50"],
  ["Paladin Operational 26-50 + HIPAA", "operational26To50Hipaa"],
  ["Paladin Operational 51-100", "operational51To100"],
  ["Paladin Operational 51-100 + HIPAA", "operational51To100Hipaa"],
  ["Paladin Operational 101-250", "operational101To250"],
  ["Paladin Operational 101-250 + HIPAA", "operational101To250Hipaa"],
  ["Paladin Starter", "starter"],
  ["Paladin Starter + HIPAA", "starterHipaa"],
]);
const skippedLegacyProducts = new Set([
  "Paladin Growth (1-25)",
  "Paladin Growth (1-25) + HIPAA",
  "Paladin Growth (26-100)",
  "Paladin Growth (26-100) + HIPAA",
  "Paladin Growth (101-250)",
  "Paladin Growth (101-250) + HIPAA",
  "Paladin Monthly Starter",
  "Paladin Monthly Starter + HIPAA",
]);
const expectedPriceKeys = [
  "additionalBinder",
  "additionalBinderHipaa",
  "complianceBinder",
  "complianceBinderHipaa",
  "operational101To250",
  "operational101To250Hipaa",
  "operational26To50",
  "operational26To50Hipaa",
  "operational51To100",
  "operational51To100Hipaa",
  "starter",
  "starterHipaa",
];

const csvPath = resolve("prices.csv");
const outputPath = resolve("src/lib/stripe/priceIds.ts");
const records = parseCsv(readFileSync(csvPath, "utf8"));
const priceIdEntriesByKey = new Map(
  records
    .map(toPriceIdEntry)
    .filter(Boolean)
);
const priceIdEntries = expectedPriceKeys.map((key) => [
  key,
  priceIdEntriesByKey.get(key) ?? {
    priceId: "",
    productId: "",
  },
]);

const body = `import type { PaladinPriceKey } from "@/lib/paladin/pricing";

export type StripePriceMapping = {
  priceId: string;
  productId: string;
};

// Generated from prices.csv. Regenerate with \`npm run stripe:price-ids\`.
// Stripe remains the payment processor; pricing and plan logic live in src/lib/paladin/pricing.ts.
// Blank mappings mean the app-owned price exists but the matching Stripe Price ID has not been supplied yet.
export const STRIPE_PRICE_IDS = {
${priceIdEntries.map(([key, value]) => `  ${key}: ${formatObject(value)},`).join("\n")}
} as const satisfies Record<PaladinPriceKey, StripePriceMapping>;
`;

writeFileSync(outputPath, body);

function toPriceIdEntry(record) {
  const productName = record["Product Name"];
  const key = productKeyMap.get(productName);

  if (!key && skippedLegacyProducts.has(productName)) {
    return null;
  }

  if (!key) {
    throw new Error(`Unsupported Stripe product in prices.csv: ${productName}`);
  }

  return [
    key,
    {
      priceId: record["Price ID"],
      productId: record["Product ID"],
    },
  ];
}

function formatObject(value) {
  const fields = Object.entries(value).map(
    ([key, fieldValue]) => `    ${key}: ${JSON.stringify(fieldValue)}`
  );

  return `{\n${fields.join(",\n")},\n  }`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === "\"" && nextCharacter === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (character === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell);
      cell = "";

      if (row.some((value) => value.trim())) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += character;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...records] = rows;

  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""]))
  );
}
