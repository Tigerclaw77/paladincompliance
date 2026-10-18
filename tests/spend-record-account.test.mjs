import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  annualSummaryToCsv,
  canWriteSpendRecords,
  parseSpendEntryInput,
  spendRowToEntry,
  summarizeSpend,
} from "../src/lib/paladin/spendRecord.ts";

const valid = {
  id: "abc-123_x",
  date: "2026-03-01",
  category: "Training & awareness",
  vendor: "Acme",
  purpose: "Staff session",
  amount: 123.456,
  recurrence: "Recurring",
};

test("entry input is validated and converted to integer cents", () => {
  const r = parseSpendEntryInput(valid);
  assert.equal(r.ok, true);
  assert.equal(r.value.amountCents, 12346);
  assert.equal(r.value.recurrence, "Recurring");
  assert.equal(r.value.clientId, "abc-123_x");
});

test("entry input rejects bad ids, dates, categories, amounts and long text", () => {
  for (const bad of [
    { ...valid, id: "../etc" },
    { ...valid, id: "x".repeat(65) },
    { ...valid, date: "03/01/2026" },
    { ...valid, category: "Nope" },
    { ...valid, amount: -1 },
    { ...valid, amount: 1e12 },
    { ...valid, vendor: "" },
    { ...valid, purpose: "x".repeat(501) },
    { ...valid, notes: 5 },
    null,
    "str",
  ]) {
    assert.equal(parseSpendEntryInput(bad).ok, false, JSON.stringify(bad));
  }
});

test("only owners and admins may write; members read-only", () => {
  assert.equal(canWriteSpendRecords("OWNER"), true);
  assert.equal(canWriteSpendRecords("ADMIN"), true);
  assert.equal(canWriteSpendRecords("MEMBER"), false);
  assert.equal(canWriteSpendRecords(undefined), false);
});

test("stored rows round-trip into summary and annual CSV", () => {
  const entry = spendRowToEntry({
    clientId: "e1",
    entryDate: new Date("2026-05-10T00:00:00Z"),
    category: "Training & awareness",
    vendor: "Acme",
    purpose: "Staff session",
    amountCents: 45000,
    recurrence: "One-time",
    reference: "",
    approvedBy: "",
    notes: "",
  });
  assert.equal(entry.date, "2026-05-10");
  assert.equal(entry.amount, 450);
  const summary = summarizeSpend([entry], "2026-01-01");
  const csv = annualSummaryToCsv("Org, Inc", summary);
  assert.match(csv, /"Org, Inc"/);
  assert.match(csv, /Training & awareness,0\.00,450\.00,0\.00,0\.00,450\.00,100\.0%/);
  assert.match(csv, /Total,,,,,450\.00/);
});

test("spend API routes derive the organization from the session, never the request", async () => {
  for (const file of [
    "src/app/api/spend-record/route.ts",
    "src/app/api/spend-record/export/route.ts",
  ]) {
    const text = await readFile(file, "utf8");
    assert.match(text, /getSpendAccess\(\)/, file);
    assert.match(text, /status: 401/, file);
    assert.doesNotMatch(text, /searchParams\.get\("org/i, file);
    assert.doesNotMatch(text, /body\??\.organizationId/, file);
  }
  const route = await readFile("src/app/api/spend-record/route.ts", "utf8");
  assert.match(route, /canWriteSpendRecords\(access\.role\)/);
  assert.match(route, /organizationId: access\.organizationId/);
});

test("migration for subscriber benefits is additive only", async () => {
  const sql = await readFile(
    "prisma/migrations/20261017180000_add_subscriber_benefits/migration.sql",
    "utf8"
  );
  assert.doesNotMatch(sql, /DROP\s|ALTER TABLE "[A-Za-z]+" (DROP|ALTER COLUMN)|DELETE FROM|TRUNCATE|RENAME/i);
  for (const t of ["BinderRevision", "BinderRevisionNotice", "RenewalReminder", "AiSpendEntry"]) {
    assert.match(sql, new RegExp(`CREATE TABLE "${t}"`));
  }
  const alters = sql.match(/ALTER TABLE "(\w+)"/g) ?? [];
  for (const a of alters) assert.match(a, /BinderRevisionNotice|AiSpendEntry/);
});
