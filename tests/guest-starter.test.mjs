import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildGuestStarterMetadata,
  isGuestCheckoutMetadata,
  isGuestStarterCatalogKey,
  parseGuestStarterInput,
} from "../src/lib/paladin/guestStarter.ts";

const valid = {
  email: " Buyer@Example.com ",
  industry: "Healthcare",
  organizationName: "Acme Clinic",
  staffAttestation: true,
  hipaaEnabled: true,
};

test("guest Starter input is normalized and validated", () => {
  const result = parseGuestStarterInput(valid);
  assert.equal(result.ok, true);
  assert.equal(result.value.email, "buyer@example.com");
  assert.equal(result.value.hipaaEnabled, true);
  assert.equal(parseGuestStarterInput({ ...valid, staffAttestation: false }).ok, false);
  assert.equal(parseGuestStarterInput({ ...valid, email: "nope" }).ok, false);
  assert.equal(parseGuestStarterInput({ ...valid, organizationName: "A" }).ok, false);
  assert.equal(parseGuestStarterInput({ ...valid, industry: "Mining" }).ok, false);
  assert.equal(
    parseGuestStarterInput({ ...valid, industry: "Other" }).value.hipaaEnabled,
    false
  );
});

test("only Starter catalog keys are guest-purchasable", () => {
  assert.equal(isGuestStarterCatalogKey("starter"), true);
  assert.equal(isGuestStarterCatalogKey("starterHipaa"), true);
  assert.equal(isGuestStarterCatalogKey("operational26To50"), false);
  assert.equal(isGuestStarterCatalogKey("complianceBinder"), false);
});

test("guest metadata flag round trips", () => {
  const metadata = buildGuestStarterMetadata(parseGuestStarterInput(valid).value);
  assert.equal(isGuestCheckoutMetadata(metadata), true);
  assert.equal(isGuestCheckoutMetadata({}), false);
});

test("Starter route is not behind the auth middleware and webhook provisions guests", async () => {
  const [middleware, webhook, route] = await Promise.all([
    readFile("middleware.ts", "utf8"),
    readFile("src/app/api/stripe/webhook/route.ts", "utf8"),
    readFile("src/app/api/stripe/create-checkout-session/route.ts", "utf8"),
  ]);
  assert.doesNotMatch(middleware, /\/start\/starter/);
  assert.match(middleware, /\/start\/operational/);
  assert.match(webhook, /provisionGuestStarterOrganization/);
  assert.match(route, /createGuestStarterCheckoutSession/);
});

test("pricing page shows the binder price and no contradictory member-only copy", async () => {
  const pricing = await readFile("src/app/pricing/PricingClient.tsx", "utf8");
  assert.doesNotMatch(pricing, /Current add-on reference/);
  assert.doesNotMatch(pricing, new RegExp(["honest", "lenses"].join(""), "i"));
  assert.match(pricing, /Buy Starter/);
  assert.match(pricing, /we spent \$X on AI compliance this year/);
});
