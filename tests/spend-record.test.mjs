import assert from "node:assert/strict";
import test from "node:test";
import {
  SPEND_CATEGORY_NAMES,
  SPEND_RECORD_CSV_COLUMNS,
  parseAmount,
  parseIsoDate,
  spendEntriesToCsv,
  spendStatement,
  summarizeSpend,
} from "../src/lib/paladin/spendRecord.ts";

const entry = (over) => ({
  id: "x",
  date: "2026-02-14",
  category: "Training & awareness",
  vendor: "Vendor",
  purpose: "Staff session",
  amount: 100,
  recurrence: "One-time",
  reference: "INV-1",
  approvedBy: "",
  notes: "",
  ...over,
});

test("amount and date parsing is strict", () => {
  assert.equal(parseAmount("$1,234.567"), 1234.57);
  assert.equal(parseAmount("-5"), null);
  assert.equal(parseAmount("abc"), null);
  assert.equal(parseAmount(0), 0);
  assert.ok(parseIsoDate("2026-02-28"));
  assert.equal(parseIsoDate("2026-02-30"), null);
  assert.equal(parseIsoDate("02/28/2026"), null);
});

test("annual summary totals by category and fiscal quarter", () => {
  const summary = summarizeSpend(
    [
      entry({ amount: 450 }),
      entry({ date: "2026-05-01", category: "Policy & governance program", amount: 499, recurrence: "Recurring" }),
      entry({ date: "2026-11-01", amount: 100.5, recurrence: "Recurring" }),
      entry({ date: "2027-01-01", amount: 999 }), // next fiscal year
      entry({ category: "Not a category", amount: 5 }),
    ],
    "2026-01-01"
  );
  assert.equal(summary.total, 1049.5);
  assert.equal(summary.entryCount, 3);
  assert.equal(summary.outsideOrInvalid, 2);
  assert.equal(summary.recurringTotal, 599.5);
  assert.equal(summary.oneTimeTotal, 450);
  assert.equal(summary.fiscalYearEnd, "2026-12-31");
  const training = summary.rows.find((r) => r.category === "Training & awareness");
  assert.deepEqual(training.quarters, [450, 0, 0, 100.5]);
  assert.equal(summary.rows.length, SPEND_CATEGORY_NAMES.length);
  const shares = summary.rows.reduce((s, r) => s + r.share, 0);
  assert.ok(Math.abs(shares - 1) < 1e-9);
});

test("non-calendar fiscal years bucket quarters from the start date", () => {
  const summary = summarizeSpend(
    [entry({ date: "2026-07-01" }), entry({ date: "2026-10-01" }), entry({ date: "2027-06-30" })],
    "2026-07-01"
  );
  const row = summary.rows.find((r) => r.category === "Training & awareness");
  assert.deepEqual(row.quarters, [100, 100, 0, 100]);
  assert.equal(summarizeSpend([], "not-a-date"), null);
});

test("CSV export has the documented columns and neutralizes formulas", () => {
  const csv = spendEntriesToCsv([
    entry({ vendor: '=HYPERLINK("http://x")', purpose: 'a "quoted", purpose' }),
  ]);
  const [header, row] = csv.trim().split("\r\n");
  assert.equal(header.split(",").length, SPEND_RECORD_CSV_COLUMNS.length);
  for (const col of ["Date", "Category", "Vendor", "Purpose", "Amount"]) {
    assert.match(header, new RegExp(col));
  }
  assert.match(row, /'=HYPERLINK/);
  assert.match(row, /"a ""quoted"", purpose"/);
});

test("annual statement is framed as the organization's own unaudited record", () => {
  const s = summarizeSpend([entry({ amount: 250 })], "2026-01-01");
  const text = spendStatement("Acme", s);
  assert.match(text, /\$250\.00/);
  assert.match(text, /unaudited/);
  assert.doesNotMatch(text, /certified|verified|assured|compliant/i);
});
