import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PALADIN_PRICING } from "../src/lib/paladin/pricing.ts";

test("public binder remains a $249.99 anonymous one-time catalog item", () => {
  assert.equal(PALADIN_PRICING.complianceBinder.amountCents, 24_999);
  assert.equal(PALADIN_PRICING.complianceBinder.mode, "payment");
  assert.equal(PALADIN_PRICING.complianceBinder.visibility, "public");
});

test("Starter remains a $499 annual subscription catalog item", () => {
  assert.equal(PALADIN_PRICING.starter.amountCents, 49_900);
  assert.equal(PALADIN_PRICING.starter.interval, "year");
  assert.equal(PALADIN_PRICING.starter.mode, "subscription");
});

test("public order route reuses binder Checkout and pricing links to it", async () => {
  const [orderSource, pricingSource] = await Promise.all([
    readFile("src/app/order/page.tsx", "utf8"),
    readFile("src/app/pricing/PricingClient.tsx", "utf8"),
  ]);

  assert.match(orderSource, /BinderCheckoutControls/);
  assert.match(orderSource, /priceKey="complianceBinder"/);
  assert.match(pricingSource, /href="\/order"/);
  assert.match(
    pricingSource,
    /formatPaladinPrice\(publicBinderItem\)/
  );
});

test("binder Checkout requires shipping and returns canceled guests to order", async () => {
  const checkoutSource = await readFile(
    "src/app/api/stripe/create-checkout-session/route.ts",
    "utf8"
  );

  assert.match(checkoutSource, /shipping_address_collection/);
  assert.match(checkoutSource, /allowed_countries:\s*\["US"\]/);
  assert.match(checkoutSource, /\/order\?checkout=binder-cancel/);
});
