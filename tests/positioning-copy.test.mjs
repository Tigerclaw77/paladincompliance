import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { PALADIN_PRICING } from "../src/lib/paladin/pricing.ts";
import {
  getActiveModules,
  resolveVerificationLifecycle,
} from "../src/lib/paladin/verification.ts";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(tsx?|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test("no legacy contact address or banned name anywhere in src", async () => {
  for (const file of await walk("src")) {
    const text = await readFile(file, "utf8");
    assert.doesNotMatch(text, new RegExp(["honest", "lenses"].join(""), "i"), file);
    assert.doesNotMatch(text, new RegExp(["drig", "gers"].join(""), "i"), file);
  }
});

test("public contact email: Paladin domain only, single constant, safe override", async () => {
  const env = await import("../src/lib/paladin/env.ts");
  assert.equal(env.DEFAULT_PUBLIC_CONTACT_EMAIL, "contact@paladincompliance.com");
  assert.equal(env.resolvePublicContactEmail(undefined), "contact@paladincompliance.com");
  assert.equal(
    env.resolvePublicContactEmail("Support@PaladinCompliance.com"),
    "support@paladincompliance.com"
  );
  assert.equal(
    env.resolvePublicContactEmail("someone@elsewhere.example"),
    "contact@paladincompliance.com"
  );
  assert.equal(
    env.resolvePublicContactEmail("x@paladincompliance.com.evil.example"),
    "contact@paladincompliance.com"
  );
});

test("no other organization's domain appears in the repo source", async () => {
  const banned = [["passport", "informatics"].join("")];
  for (const file of [...(await walk("src")), ...(await walk("tests"))]) {
    const text = await readFile(file, "utf8");
    for (const word of banned) assert.doesNotMatch(text, new RegExp(word, "i"), file);
  }
});

test("binder pricing: $249.99 public, $124.99 additional, Starter $499/yr", () => {
  assert.equal(PALADIN_PRICING.complianceBinder.amountCents, 24999);
  assert.equal(PALADIN_PRICING.complianceBinder.visibility, "public");
  assert.equal(PALADIN_PRICING.additionalBinder.amountCents, 12499);
  assert.equal(PALADIN_PRICING.additionalBinder.visibility, "active_coverage");
  assert.equal(PALADIN_PRICING.additionalBinderHipaa.amountCents, 17499);
  assert.equal(PALADIN_PRICING.starter.amountCents, 49900);
  assert.equal(PALADIN_PRICING.starter.interval, "year");
});

test("public pages never claim certification, compliance, or guarantees", async () => {
  const files = [
    "src/app/page.tsx",
    "src/components/Hero.tsx",
    "src/components/PaladinSystem.tsx",
    "src/app/pricing/PricingClient.tsx",
    "src/app/whats-included/page.tsx",
    "src/app/sample/page.tsx",
    "src/app/sample/registry/page.tsx",
    "src/components/verification/RegistryRecordView.tsx",
    "src/lib/paladin/copy.ts",
  ];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    assert.doesNotMatch(text, /Verified Organization|Assurance|We guarantee|is guaranteed|HIPAA[- ]compliant|certified by|Download Verification Certificate/i, file);
    // Every "certif*" / "guarantee" / "legal advice" mention must be a negation.
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (/certif|guarantee/i.test(line) && !line.trim().startsWith("//")) {
        const window = lines.slice(Math.max(0, i - 2), i + 1).join(" ");
        assert.match(window, /\b(not|no|never|nor|without|does not|do not)\b/i, `${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }
});

test("positioning, disclaimer, and owner framing are present", async () => {
  const copy = await readFile("src/lib/paladin/copy.ts", "utf8");
  assert.match(copy, /AI Policy & Evidence Binder/);
  assert.match(copy, /we spent \$X on AI compliance this year/);
  assert.match(copy, /supports, and does not replace, responsible AI use/);
  assert.match(copy, /public registry record showing this binder was issued to this organization/i);
  const layout = await readFile("src/app/layout.tsx", "utf8");
  assert.match(layout, /DisclaimerBanner/);
  const pricing = await readFile("src/app/pricing/PricingClient.tsx", "utf8");
  assert.match(pricing, /insurance renewals/i);
  assert.match(pricing, /client security questionnaires/i);
  assert.match(pricing, /board or\s+budget records/i);
});

test("sample pages are clearly labeled and contain no invented customers", async () => {
  const [sample, registry, view, data] = await Promise.all([
    readFile("src/app/sample/page.tsx", "utf8"),
    readFile("src/app/sample/registry/page.tsx", "utf8"),
    readFile("src/components/verification/RegistryRecordView.tsx", "utf8"),
    readFile("src/lib/paladin/sampleRegistry.ts", "utf8"),
  ]);
  assert.match(sample, /fictitious/i);
  assert.match(registry, /index: false/);
  assert.match(view, /SAMPLE ONLY/);
  assert.match(data, /Example Organization \(Sample\)/);
  assert.match(data, /PLD-SAMPLE-000000/);
  assert.doesNotMatch(sample + registry + data, /testimonial|trusted by|customers include/i);
});

test("binder module shows 'Included with plan' for active plans", () => {
  const entitlements = {
    features: {
      downloadableAssets: { allowed: true },
      hipaaAddOn: { allowed: false },
      verificationModules: { allowed: true },
    },
  };
  const find = (mods) => mods.find((m) => m.label === "Binder");
  const active = find(getActiveModules("published", { status: "active" }, [], entitlements));
  assert.equal(active.tone, "active");
  assert.equal(active.stateLabel, "Included with plan");
  const none = find(getActiveModules("draft", null, [], entitlements));
  assert.equal(none.tone, "draft");
  assert.equal(none.stateLabel, "Not yet issued");
  const withAsset = find(
    getActiveModules("draft", null, [{ assetType: "PDF", title: "x" }], entitlements)
  );
  assert.equal(withAsset.tone, "active");
});

test("lifecycle copy avoids coverage/verified wording", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  for (const input of [
    { currentPeriodEnd: new Date("2027-06-01T00:00:00Z"), subscriptionStatus: "active", verificationStatus: "published" },
    { currentPeriodEnd: new Date("2026-01-01T00:00:00Z"), subscriptionStatus: "canceled", verificationStatus: "inactive" },
    { subscriptionStatus: "pending", verificationStatus: "draft" },
    { subscriptionStatus: "past_due", verificationStatus: "published" },
  ]) {
    const l = resolveVerificationLifecycle({ ...input, now });
    assert.doesNotMatch(l.description, /coverage|assurance|verified/i);
  }
});

test("customer copy does not over-promise support SLAs, HIPAA content, or the full binder as a download", async () => {
  const contact = await readFile("src/app/contact/page.tsx", "utf8");
  assert.doesNotMatch(contact, /within one to two business days/i);
  const pricing = await readFile("src/app/pricing/PricingClient.tsx", "utf8");
  for (const phrase of [
    "Priority setup and update handling",
    "Executive onboarding",
    "Listing placement",
    "Update inserts when materials change",
    "HIPAA policy module",
  ]) {
    assert.ok(!pricing.includes(phrase), phrase);
  }
  const assets = await readFile("src/lib/paladin/assets.ts", "utf8");
  assert.match(assets, /Quick-reference record \(13 pages, PDF\)/);
  assert.doesNotMatch(assets, /Paladin Compliance Binder PDF/);
  const pdf = await readFile("src/lib/paladin/pdf/binder.ts", "utf8");
  assert.match(pdf, /Quick-Reference Record/);
});
