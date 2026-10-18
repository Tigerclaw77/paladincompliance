// Read-only: looks up Stripe prices by lookup key and prints the JSON to put in
// the STRIPE_LIVE_PRICE_IDS_JSON environment variable. Makes only GET requests
// and never creates or edits Stripe objects.
//
//   STRIPE_SECRET_KEY=sk_live_... node scripts/resolve-stripe-price-ids.mjs
//
// The owner creates the prices in the Stripe dashboard first, setting these
// lookup keys (see STRIPE_LOOKUP_KEYS in src/lib/paladin/pricing.ts). Keys that
// are not found are reported and left out, which makes checkout fail closed.
const LOOKUP_KEYS = {
  additionalBinder: "paladin_binder_additional",
  complianceBinder: "paladin_binder_standalone",
  starter: "paladin_starter_annual",
};
const EXPECTED = {
  additionalBinder: { amount: 12499, recurring: false },
  complianceBinder: { amount: 24999, recurring: false },
  starter: { amount: 49900, recurring: true, interval: "year" },
};

const key = process.env.STRIPE_SECRET_KEY ?? "";

if (!/^(sk|rk)_(live|test)_/.test(key)) {
  console.error("Set STRIPE_SECRET_KEY to a Stripe secret or restricted key.");
  process.exit(2);
}

const wantLive = key.includes("_live_");
const query = Object.values(LOOKUP_KEYS)
  .map((k) => `lookup_keys[]=${encodeURIComponent(k)}`)
  .join("&");
const response = await fetch(`https://api.stripe.com/v1/prices?active=true&limit=20&${query}`, {
  headers: { Authorization: `Bearer ${key}` },
});

if (!response.ok) {
  console.error(`Stripe returned HTTP ${response.status}.`);
  process.exit(1);
}

const { data } = await response.json();
const result = {};
let problems = 0;

for (const [appKey, lookupKey] of Object.entries(LOOKUP_KEYS)) {
  const price = data.find((p) => p.lookup_key === lookupKey);
  const expected = EXPECTED[appKey];

  if (!price) {
    console.error(`MISSING ${appKey}: no active price with lookup key ${lookupKey}`);
    problems += 1;
    continue;
  }

  const issues = [];

  if (price.livemode !== wantLive) issues.push("livemode does not match the key");
  if (price.unit_amount !== expected.amount) issues.push(`amount ${price.unit_amount} != ${expected.amount}`);
  if (price.currency !== "usd") issues.push(`currency ${price.currency}`);
  if (Boolean(price.recurring) !== expected.recurring) issues.push("recurring flag mismatch");
  if (expected.interval && price.recurring?.interval !== expected.interval) issues.push("interval mismatch");

  if (issues.length) {
    console.error(`MISMATCH ${appKey} (${price.id}): ${issues.join("; ")}`);
    problems += 1;
    continue;
  }

  result[appKey] = price.id;
}

console.log(JSON.stringify(result));
process.exit(problems ? 1 : 0);
