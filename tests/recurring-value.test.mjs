import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runComplianceReminders } from "../src/lib/paladin/benefits/complianceReminders.ts";
import { createSendBudget, sendWithBudget } from "../src/lib/paladin/benefits/types.ts";
import {
  CALENDAR_EVENT_DEFINITIONS,
  computeCalendar,
  isReminderDue,
} from "../src/lib/paladin/calendar/events.ts";
import { buildIcs, escapeIcsText, foldIcsLine } from "../src/lib/paladin/calendar/ics.ts";
import { toCsv } from "../src/lib/paladin/csv.ts";
import { EMAIL_DISCLAIMER, renderEmail } from "../src/lib/paladin/email/templates.ts";
import {
  buildUnsubscribeUrl,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../src/lib/paladin/email/unsubscribe.ts";
import {
  buildOrderNotificationEmail,
  isFulfillableOrder,
} from "../src/lib/paladin/orders/notification.ts";
import {
  checkoutPriceKeys,
  hipaaPriceKeys,
  isCheckoutKeyEnabled,
  normalizeCheckoutPriceKey,
  operationalPriceKeys,
} from "../src/lib/paladin/pricing.ts";
import { CHECKLISTS, validateReviewInput } from "../src/lib/paladin/reviews/checklists.ts";
import {
  TRAINING_MODULES,
  acknowledgmentStatus,
  validateAcknowledgmentInput,
} from "../src/lib/paladin/training/content.ts";
import { parseLivePriceIds, resolvePriceMappings } from "../src/lib/stripe/priceConfig.ts";

const SECRET = "test-secret-with-enough-length";
const NOW = new Date("2027-01-15T12:00:00Z");

test("calendar derives dated events from the membership period only", () => {
  assert.deepEqual(computeCalendar({ from: NOW, periodEnd: null, periodStart: null }), []);
  const events = computeCalendar({
    from: new Date("2026-12-01T00:00:00Z"),
    periodEnd: new Date("2027-12-01T00:00:00Z"),
    periodStart: new Date("2026-12-01T00:00:00Z"),
  });
  const keys = events.map((e) => e.key);
  assert.ok(keys.includes("ai_tool_inventory_review"));
  assert.ok(keys.includes("vendor_review"));
  assert.ok(keys.includes("renewal"));
  assert.equal(events.filter((e) => e.key === "ai_tool_inventory_review").length, 4);
  assert.equal(events.filter((e) => e.key === "vendor_review").length, 2);
  const sorted = [...events].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  assert.deepEqual(events.map((e) => e.dueDate), sorted.map((e) => e.dueDate));
  assert.ok(CALENDAR_EVENT_DEFINITIONS.length >= 5);
});

test("calendar skips past events and reminder window is 7 days", () => {
  const events = computeCalendar({
    from: new Date("2027-06-01T00:00:00Z"),
    periodEnd: new Date("2027-12-01T00:00:00Z"),
    periodStart: new Date("2026-12-01T00:00:00Z"),
  });
  assert.ok(events.every((e) => e.dueDate >= "2027-06-01"));
  assert.equal(isReminderDue("2027-02-01", new Date("2027-01-25T00:00:00Z")), true);
  assert.equal(isReminderDue("2027-02-01", new Date("2027-01-24T00:00:00Z")), false);
  assert.equal(isReminderDue("2027-02-01", new Date("2027-02-02T00:00:00Z")), false);
  assert.equal(isReminderDue("garbage", NOW), false);
});

test("ICS output is RFC 5545 shaped, escaped and folded", () => {
  assert.equal(escapeIcsText("a,b;c\nd\\e"), "a\\,b\\;c\\nd\\\\e");
  const folded = foldIcsLine("X".repeat(200));
  assert.ok(folded.split("\r\n").every((l) => l.length <= 75));
  const ics = buildIcs({
    calendarName: "Org, Inc",
    events: [
      { date: "2027-03-31", description: "Do it", summary: "Review; tools", uid: "u1@paladin", url: "https://example.test/x" },
    ],
    now: NOW,
  });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270331/);
  assert.match(ics, /DTEND;VALUE=DATE:20270401/);
  assert.match(ics, /SUMMARY:Review\\; tools/);
  assert.match(ics, /X-WR-CALNAME:Org\\, Inc/);
});

test("CSV escapes quotes, commas, newlines and spreadsheet formulas", () => {
  const csv = toCsv([["a", 'b"c', "d,e"], ["=SUM(A1)", "x\ny", 3]]);
  assert.match(csv, /"b""c"/);
  assert.match(csv, /"d,e"/);
  assert.doesNotMatch(csv, /(^|,)=SUM/m);
});

test("emails carry the disclaimer; reminders require unsubscribe", () => {
  const base = {
    contactEmail: "contact@example.test",
    heading: "Hello",
    paragraphs: ["Body <b>text</b>"],
    reason: "You are a member.",
  };
  const transactional = renderEmail({ ...base, kind: "transactional" });
  assert.ok(transactional.text.includes(EMAIL_DISCLAIMER));
  assert.ok(transactional.html.includes("Body &lt;b&gt;text&lt;/b&gt;"));
  assert.throws(() => renderEmail({ ...base, kind: "reminder" }));
  const reminder = renderEmail({ ...base, kind: "reminder", unsubscribeUrl: "https://example.test/unsubscribe?e=a" });
  assert.match(reminder.text, /unsubscribe/i);
});

test("unsubscribe tokens are bound to the address and secret", () => {
  const token = signUnsubscribeToken("A@X.test", SECRET);
  assert.equal(verifyUnsubscribeToken("a@x.test", token, SECRET), true);
  assert.equal(verifyUnsubscribeToken("b@x.test", token, SECRET), false);
  assert.equal(verifyUnsubscribeToken("a@x.test", token, "another-secret-long-enough"), false);
  assert.equal(verifyUnsubscribeToken("a@x.test", "", SECRET), false);
  assert.throws(() => signUnsubscribeToken("a@x.test", "short"));
  assert.match(buildUnsubscribeUrl({ email: "a@x.test", secret: SECRET, siteUrl: "https://s.test" }), /^https:\/\/s\.test\/unsubscribe\?e=/);
});

test("send budget caps sends and does not count capped messages", async () => {
  const budget = createSendBudget(1);
  const sent = [];
  const mailer = async (m) => sent.push(m);
  assert.equal(await sendWithBudget(budget, mailer, { to: "a", subject: "s", text: "t" }), "sent");
  assert.equal(await sendWithBudget(budget, mailer, { to: "b", subject: "s", text: "t" }), "capped");
  assert.equal(sent.length, 1);
  assert.equal(budget.capped, 1);
  assert.equal(
    await sendWithBudget(createSendBudget(5), async () => { throw new Error("smtp"); }, { to: "a", subject: "s", text: "t" }),
    "failed"
  );
});

function reminderDeps(overrides = {}) {
  const sent = [];
  const recorded = new Set();
  const key = (k) => `${k.organizationId}|${k.eventKey}|${k.dueDate}|${k.email}`;
  const deps = {
    contactEmail: "contact@example.test",
    emailConfigured: true,
    hasReminder: async (k) => recorded.has(key(k)),
    listCalendarOrganizations: async () => [
      {
        cancelAtPeriodEnd: false,
        organizationId: "o1",
        organizationName: "Org One",
        periodEnd: new Date("2027-12-01T00:00:00Z"),
        periodStart: new Date("2026-12-01T00:00:00Z"),
        recipients: ["a@x.test", "A@x.test", "opt@x.test"],
      },
    ],
    listOptedOutEmails: async () => new Set(["opt@x.test"]),
    recordReminder: async (k) => { recorded.add(key(k)); },
    sendMail: async (m) => { sent.push(m); },
    siteUrl: "https://example.test",
    unsubscribeUrlFor: (e) => `https://example.test/unsubscribe?e=${e}`,
    ...overrides,
  };
  return { deps, recorded, sent };
}

test("compliance reminders: due window, opt-out, dedup, cap, dry run, failures", async () => {
  // 2027-03-01 is the first quarterly date; 7 days earlier is inside the window.
  const now = new Date("2027-02-26T12:00:00Z");
  const { deps, sent } = reminderDeps();
  const first = await runComplianceReminders(deps, { now });
  assert.equal(first.sent, 1);
  assert.equal(first.optedOut, 1);
  assert.equal(sent[0].to, "a@x.test");
  assert.match(sent[0].text, /unsubscribe/i);
  const second = await runComplianceReminders(deps, { now });
  assert.equal(second.sent, 0);
  assert.equal(second.alreadySent, 1);

  const dry = reminderDeps();
  const dryResult = await runComplianceReminders(dry.deps, { dryRun: true, now });
  assert.equal(dryResult.wouldSend, 1);
  assert.equal(dry.sent.length, 0);

  const capped = reminderDeps();
  const cappedResult = await runComplianceReminders(capped.deps, { budget: createSendBudget(0), now });
  assert.equal(cappedResult.capped, 1);
  assert.equal(capped.recorded.size, 0);

  const failing = reminderDeps({ sendMail: async () => { throw new Error("smtp down"); } });
  const failedResult = await runComplianceReminders(failing.deps, { now });
  assert.equal(failedResult.failed, 1);
  assert.equal(failing.recorded.size, 0);

  const off = reminderDeps({ emailConfigured: false });
  assert.equal((await runComplianceReminders(off.deps, { now })).sent, 0);

  const cancelled = reminderDeps({
    listCalendarOrganizations: async () => [
      { cancelAtPeriodEnd: true, organizationId: "o1", organizationName: "O", periodEnd: new Date("2027-12-01T00:00:00Z"), periodStart: new Date("2026-12-01T00:00:00Z"), recipients: ["a@x.test"] },
    ],
  });
  assert.equal((await runComplianceReminders(cancelled.deps, { now })).sent, 0);
});

test("training modules have substantive content and no certification wording", () => {
  assert.ok(TRAINING_MODULES.length >= 3);

  for (const mod of TRAINING_MODULES) {
    const text = JSON.stringify(mod);
    assert.ok(mod.sections.length >= 4, mod.slug);
    assert.ok(text.length > 3500, `${mod.slug} is too thin`);
    assert.doesNotMatch(text, /certif(y|ied|ication)|guarantee[sd]? compliance|HIPAA compliant/i, mod.slug);
  }
});

test("training acknowledgments validate name, date window and email", () => {
  const ok = { acknowledgedOn: "2027-01-10", moduleSlug: "ai-acceptable-use", personName: "Pat Lee" };
  assert.equal(validateAcknowledgmentInput(ok, NOW).ok, true);
  assert.equal(validateAcknowledgmentInput({ ...ok, moduleSlug: "nope" }, NOW).ok, false);
  assert.equal(validateAcknowledgmentInput({ ...ok, personName: "P" }, NOW).ok, false);
  assert.equal(validateAcknowledgmentInput({ ...ok, personEmail: "bad" }, NOW).ok, false);
  assert.equal(validateAcknowledgmentInput({ ...ok, acknowledgedOn: "2027-02-30" }, NOW).ok, false);
  assert.equal(validateAcknowledgmentInput({ ...ok, acknowledgedOn: "2027-03-30" }, NOW).ok, false);
  assert.equal(validateAcknowledgmentInput({ ...ok, acknowledgedOn: "2025-01-01" }, NOW).ok, false);
  assert.equal(acknowledgmentStatus(null, NOW), "none");
  assert.equal(acknowledgmentStatus("2026-06-01", NOW), "current");
  assert.equal(acknowledgmentStatus("2025-06-01", NOW), "due");
});

test("review checklists validate and ignore unknown items", () => {
  assert.ok(CHECKLISTS.length === 2);
  const checklist = CHECKLISTS[0];
  const good = validateReviewInput(
    { checkedItemIds: [checklist.items[0].id, checklist.items[0].id, "bogus"], checklistKey: checklist.key, notes: "ok", reviewedOn: "2027-01-10", reviewerName: "Pat Lee" },
    NOW
  );
  assert.equal(good.ok, true);
  assert.deepEqual(good.value.checkedItemIds, [checklist.items[0].id]);
  assert.equal(validateReviewInput({ checklistKey: "x", reviewedOn: "2027-01-10", reviewerName: "Pat Lee" }, NOW).ok, false);
  assert.equal(validateReviewInput({ checklistKey: checklist.key, reviewedOn: "2028-01-10", reviewerName: "Pat Lee" }, NOW).ok, false);
});

test("HIPAA add-on has no purchasable key and Operational is gated", () => {
  assert.ok(hipaaPriceKeys.length > 0);

  for (const key of hipaaPriceKeys) {
    assert.equal(checkoutPriceKeys.includes(key), false, key);
    assert.equal(isCheckoutKeyEnabled(key, { PALADIN_OPERATIONAL_CHECKOUT_ENABLED: "true" }), false, key);
    assert.equal(normalizeCheckoutPriceKey(key), null, key);
  }

  for (const key of operationalPriceKeys) {
    assert.equal(isCheckoutKeyEnabled(key, {}), false, key);
    assert.equal(isCheckoutKeyEnabled(key, { PALADIN_OPERATIONAL_CHECKOUT_ENABLED: "true" }), true, key);
  }

  assert.equal(isCheckoutKeyEnabled("starter", {}), true);
  assert.equal(isCheckoutKeyEnabled("complianceBinder", {}), true);
});

test("customer-facing source no longer advertises the HIPAA add-on", async () => {
  const files = [
    "src/components/PricingClient.tsx",
    "src/components/GuestStarterForm.tsx",
    "src/app/pricing/page.tsx",
    "src/app/whats-included/page.tsx",
    "src/app/dashboard/billing/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/contact/page.tsx",
  ];

  for (const file of files) {
    let text = "";

    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }

    assert.doesNotMatch(text, /hipaa add-?on|hipaa upsell|hipaa module/i, file);
  }
});

test("live price ids come only from validated env JSON and fail closed", () => {
  const test_ = { starter: { priceId: "price_TEST1", productId: "prod_T" }, complianceBinder: { priceId: "price_TEST2", productId: "prod_T2" } };
  assert.equal(resolvePriceMappings({ liveJson: "", mode: "test", testMappings: test_ }), test_);
  const empty = resolvePriceMappings({ liveJson: "", mode: "live", testMappings: test_ });
  assert.equal(empty.starter.priceId, "");
  const live = resolvePriceMappings({ liveJson: '{"starter":"price_LIVE9","complianceBinder":"price_TEST2"}', mode: "live", testMappings: test_ });
  assert.equal(live.starter.priceId, "price_LIVE9");
  assert.equal(live.complianceBinder.priceId, "", "a test id must never be used in live mode");
  assert.equal(parseLivePriceIds("{not json").errors.length, 1);
  assert.equal(parseLivePriceIds('{"starter":"nope"}').errors.length, 1);
});

test("order alert is built only for paid binder/Starter checkouts", () => {
  const binder = {
    amount_total: 24999,
    collected_information: { shipping_details: { address: { city: "Austin", country: "US", line1: "1 Main", postal_code: "78701", state: "TX" }, name: "Pat Lee" } },
    currency: "usd",
    customer_details: { email: "pat@example.test", name: "Pat Lee" },
    id: "cs_test_1",
    livemode: false,
    metadata: { binder_quantity: "2", product_family: "binder" },
    mode: "payment",
    payment_status: "paid",
  };
  assert.equal(isFulfillableOrder(binder), true);
  assert.equal(isFulfillableOrder({ ...binder, payment_status: "unpaid" }), false);
  assert.equal(isFulfillableOrder({ ...binder, metadata: {} }), false);
  const mail = buildOrderNotificationEmail(binder);
  assert.match(mail.text, /249\.99 USD/);
  assert.match(mail.text, /1 Main/);
  assert.match(mail.subject, /x2/);
  assert.match(mail.text, /TEST/);
});

test("new member routes derive the organization from the session", async () => {
  const routes = [
    "src/app/api/calendar/ics/route.ts",
    "src/app/api/training/export/route.ts",
    "src/app/api/reviews/export/route.ts",
    "src/app/api/assets/quick-reference/route.ts",
  ];

  for (const file of routes) {
    const text = await readFile(file, "utf8");
    assert.match(text, /getSpendAccess|getMemberAccess|auth\(\)/, file);
    assert.doesNotMatch(text, /searchParams|request\.json|organizationId\s*=\s*.*(params|query)/i, file);
  }

  for (const file of ["src/app/api/cron/daily/route.ts", "src/app/api/cron/renewal-reminders/route.ts"]) {
    assert.match(await readFile(file, "utf8"), /CRON_SECRET/, file);
  }
});
