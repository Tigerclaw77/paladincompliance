import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRevisionEmail,
  releaseBinderRevision,
  validateRevisionInput,
} from "../src/lib/paladin/benefits/revisions.ts";
import {
  buildRenewalReminderEmail,
  renewalWindow,
  runRenewalReminders,
} from "../src/lib/paladin/benefits/renewalReminders.ts";
import { checkCronAuthorization } from "../src/lib/paladin/benefits/cronAuth.ts";
import { isEmailProviderConfigured } from "../src/lib/paladin/env.ts";

const DAY = 86_400_000;
const input = {
  version: "2027.1",
  title: "Annual revision",
  summary: "Updated vendor review and incident sections.",
  changes: "Section 2.4 updated",
};

function revisionDeps(overrides = {}) {
  const sent = [];
  const notices = [];
  const deps = {
    emailConfigured: true,
    siteUrl: "https://example.test",
    upsertRevision: async (value) => ({ id: "rev1", ...value }),
    listActiveSubscriberRecipients: async () => [
      { organizationId: "o1", organizationName: "Org One", email: "A@x.test" },
      { organizationId: "o1", organizationName: "Org One", email: "a@x.test" },
      { organizationId: "o2", organizationName: "Org Two", email: "b@x.test" },
    ],
    listNoticedEmails: async () => new Set(notices.map((n) => n.email)),
    recordNotice: async (n) => {
      notices.push(n);
    },
    sendMail: async (m) => {
      sent.push(m);
    },
    listOptedOutEmails: async () => new Set(),
    unsubscribeUrlFor: (email) => `https://example.test/unsubscribe?e=${email}`,
    contactEmail: "contact@example.test",
    ...overrides,
  };
  return { deps, sent, notices };
}

test("revision input validation", () => {
  assert.equal(validateRevisionInput(input).ok, true);
  assert.equal(validateRevisionInput({ ...input, version: "bad version!" }).ok, false);
  assert.equal(validateRevisionInput({ ...input, title: "x" }).ok, false);
  assert.equal(validateRevisionInput({ ...input, summary: "short" }).ok, false);
});

test("revision email states it is documentation only and links the log", () => {
  const mail = buildRevisionEmail({
    organizationName: "Org One",
    revision: { id: "r", ...input },
    siteUrl: "https://example.test",
    unsubscribeUrl: "https://example.test/unsubscribe?t=x",
  });
  assert.match(mail.subject, /2027\.1/);
  assert.match(mail.text, /dashboard\/updates/);
  assert.match(mail.text, /not legal advice/i);
});

test("revision release emails each active subscriber once, deduped by email", async () => {
  const { deps, sent, notices } = revisionDeps();
  const first = await releaseBinderRevision(deps, input);
  assert.deepEqual(
    { sent: first.sent, recipients: first.recipients, failed: first.failed },
    { sent: 2, recipients: 2, failed: 0 }
  );
  assert.equal(sent.length, 2);
  assert.equal(notices.length, 2);
  const second = await releaseBinderRevision(deps, input);
  assert.equal(second.sent, 0);
  assert.equal(second.alreadyNotified, 2);
  assert.equal(sent.length, 2);
});

test("failed sends are not recorded and are retried on re-run", async () => {
  let failFor = "b@x.test";
  const { deps, sent, notices } = revisionDeps({
    sendMail: async (m) => {
      if (m.to === failFor) throw new Error("smtp down");
      sent.push(m);
    },
  });
  const first = await releaseBinderRevision(deps, input);
  assert.equal(first.sent, 1);
  assert.equal(first.failed, 1);
  assert.equal(notices.length, 1);
  failFor = "";
  const second = await releaseBinderRevision(deps, input);
  assert.equal(second.sent, 1);
  assert.equal(second.alreadyNotified, 1);
});

test("without an email provider the revision is logged but nothing is sent", async () => {
  let upserted = false;
  const { deps, sent, notices } = revisionDeps({
    emailConfigured: false,
    upsertRevision: async (v) => {
      upserted = true;
      return { id: "rev1", ...v };
    },
  });
  const result = await releaseBinderRevision(deps, input);
  assert.equal(upserted, true);
  assert.equal(result.emailConfigured, false);
  assert.equal(result.sent, 0);
  assert.equal(sent.length, 0);
  assert.equal(notices.length, 0);
});

const now = new Date("2026-11-01T12:00:00Z");

function reminderDeps(subs, overrides = {}) {
  const sent = [];
  const recorded = [];
  const queries = [];
  const deps = {
    emailConfigured: true,
    siteUrl: "https://example.test",
    findSubscriptionsRenewingBetween: async (range) => {
      queries.push(range);
      return subs;
    },
    hasReminder: async ({ subscriptionId, periodEnd, email }) =>
      recorded.some(
        (r) =>
          r.subscriptionId === subscriptionId &&
          r.periodEnd.getTime() === periodEnd.getTime() &&
          r.email === email
      ),
    recordReminder: async (r) => {
      recorded.push(r);
    },
    sendMail: async (m) => {
      sent.push(m);
    },
    listOptedOutEmails: async () => new Set(),
    unsubscribeUrlFor: (email) => `https://example.test/unsubscribe?e=${email}`,
    contactEmail: "contact@example.test",
    ...overrides,
  };
  return { deps, sent, recorded, queries };
}

const sub = (over = {}) => ({
  subscriptionId: "s1",
  organizationId: "o1",
  organizationName: "Org One",
  planName: "Starter",
  periodEnd: new Date(now.getTime() + 29 * DAY),
  cancelAtPeriodEnd: false,
  recipients: ["owner@x.test", "Owner@x.test"],
  ...over,
});

test("renewal window is 30 days ahead with a 3 day catch-up", () => {
  const { from, to } = renewalWindow(now);
  assert.equal(to.getTime() - now.getTime(), 30 * DAY);
  assert.equal(from.getTime() - now.getTime(), 27 * DAY);
});

test("renewal reminder is sent once per period and recorded", async () => {
  const { deps, sent, recorded, queries } = reminderDeps([sub()]);
  const first = await runRenewalReminders(deps, { now });
  assert.equal(first.sent, 1);
  assert.equal(sent.length, 1);
  assert.equal(recorded.length, 1);
  assert.equal(queries[0].to.getTime() - now.getTime(), 30 * DAY);
  assert.match(sent[0].text, /\/dashboard\/billing/);
  const second = await runRenewalReminders(deps, { now });
  assert.equal(second.sent, 0);
  assert.equal(second.alreadySent, 1);
  assert.equal(sent.length, 1);
  // next year's period gets its own reminder
  const nextYear = sub({ periodEnd: new Date(now.getTime() + 29 * DAY + 365 * DAY) });
  deps.findSubscriptionsRenewingBetween = async () => [nextYear];
  const third = await runRenewalReminders(deps, { now });
  assert.equal(third.sent, 1);
});

test("subscriptions set to cancel are skipped; dry run sends nothing", async () => {
  const cancelling = reminderDeps([sub({ cancelAtPeriodEnd: true })]);
  const r1 = await runRenewalReminders(cancelling.deps, { now });
  assert.equal(r1.skippedCancelling, 1);
  assert.equal(cancelling.sent.length, 0);
  const dry = reminderDeps([sub()]);
  const r2 = await runRenewalReminders(dry.deps, { now, dryRun: true });
  assert.equal(r2.wouldSend, 1);
  assert.equal(dry.sent.length, 0);
  assert.equal(dry.recorded.length, 0);
});

test("no email provider: reminders neither sent nor recorded", async () => {
  const { deps, sent, recorded, queries } = reminderDeps([sub()], {
    emailConfigured: false,
  });
  const result = await runRenewalReminders(deps, { now });
  assert.equal(result.sent, 0);
  assert.equal(sent.length, 0);
  assert.equal(recorded.length, 0);
  assert.equal(queries.length, 0);
});

test("failed reminder send is retried on the next run", async () => {
  let fail = true;
  const { deps, recorded } = reminderDeps([sub({ recipients: ["o@x.test"] })], {
    sendMail: async () => {
      if (fail) throw new Error("down");
    },
  });
  const first = await runRenewalReminders(deps, { now });
  assert.equal(first.failed, 1);
  assert.equal(recorded.length, 0);
  fail = false;
  const second = await runRenewalReminders(deps, { now });
  assert.equal(second.sent, 1);
});

test("renewal email states the date and does not promise a price", () => {
  const mail = buildRenewalReminderEmail({
    organizationName: "Org One",
    periodEnd: new Date("2026-12-01T00:00:00Z"),
    planName: "Starter",
    siteUrl: "https://example.test",
  });
  assert.match(mail.subject, /2026-12-01/);
  assert.doesNotMatch(mail.text, /\$\d/);
});

test("cron authorization fails closed", () => {
  const secret = "s".repeat(32);
  assert.equal(checkCronAuthorization(`Bearer ${secret}`, secret), "ok");
  assert.equal(checkCronAuthorization(`Bearer ${"t".repeat(32)}`, secret), "unauthorized");
  assert.equal(checkCronAuthorization(null, secret), "unauthorized");
  assert.equal(checkCronAuthorization(secret, secret), "unauthorized");
  assert.equal(checkCronAuthorization(`Bearer ${secret}`, undefined), "unconfigured");
  assert.equal(checkCronAuthorization(`Bearer short`, "short"), "unconfigured");
});

test("email provider is considered configured only for a non-local EMAIL_SERVER", () => {
  const original = process.env.EMAIL_SERVER;
  try {
    delete process.env.EMAIL_SERVER;
    assert.equal(isEmailProviderConfigured(), false);
    process.env.EMAIL_SERVER = "smtp://localhost:1025";
    assert.equal(isEmailProviderConfigured(), false);
    process.env.EMAIL_SERVER = "smtp://user:pw@smtp.example.test:587";
    assert.equal(isEmailProviderConfigured(), true);
  } finally {
    if (original === undefined) delete process.env.EMAIL_SERVER;
    else process.env.EMAIL_SERVER = original;
  }
});
