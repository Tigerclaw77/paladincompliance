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

test("public contact email is a fixed constant that ignores env overrides", async () => {
  const env = await readFile("src/lib/paladin/env.ts", "utf8");
  assert.match(env, /PUBLIC_CONTACT_EMAIL = "contact@passportinformatics\.com"/);
  const fn = env.slice(env.indexOf("export function getSupportEmail"));
  const body = fn.slice(0, fn.indexOf("\n}\n"));
  assert.match(body, /return PUBLIC_CONTACT_EMAIL/);
  assert.doesNotMatch(body, /process\.env/);
});

test("binder pricing: $249.99 public, $125 additional, Starter $499/yr", () => {
  assert.equal(PALADIN_PRICING.complianceBinder.amountCents, 24999);
  assert.equal(PALADIN_PRICING.complianceBinder.visibility, "public");
  assert.equal(PALADIN_PRICING.additionalBinder.amountCents, 12500);
  assert.equal(PALADIN_PRICING.additionalBinder.visibility, "active_coverage");
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

test("binder module shows Issued for active plans (not 'Preparing')", () => {
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
  assert.equal(active.stateLabel, "Issued");
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
