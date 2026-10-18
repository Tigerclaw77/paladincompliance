// Annual AI Governance Expenditure Record: shared definitions, summary math and
// CSV export. Pure functions (no server-only imports) so the dashboard form, the
// generated binder PDF, and tests all use one source of truth.
//
// This is the organization's own unaudited documentation of what it spent. It is
// not accounting, tax, legal, or insurance advice and is not assurance,
// verification, or certification by Paladin Compliance or anyone else.

export const SPEND_CATEGORIES = [
  {
    name: "Policy & governance program",
    description:
      "Drafting or maintaining AI use policies, this binder, templates, governance tooling subscriptions.",
  },
  {
    name: "Legal & regulatory advice",
    description:
      "Outside counsel or consultants advising on AI use, contracts, privacy, or regulatory questions.",
  },
  {
    name: "Training & awareness",
    description:
      "Staff training, courses, workshops, and awareness materials about acceptable AI use.",
  },
  {
    name: "Vendor review & due diligence",
    description:
      "Time or fees spent reviewing AI vendors, security questionnaires, data-processing terms.",
  },
  {
    name: "Tools, logging & monitoring",
    description:
      "Software or services used to log, monitor, or control AI use (not the AI tools themselves).",
  },
  {
    name: "Third-party assessments",
    description:
      "Assessments, audits, or penetration tests the organization itself commissioned from an independent firm.",
  },
  {
    name: "Incident response & remediation",
    description:
      "Costs of reviewing, containing, or correcting an AI-related incident or finding.",
  },
  {
    name: "Insurance (AI-related)",
    description:
      "Premium or endorsement cost for an actual insurance policy that addresses AI-related risk.",
  },
  {
    name: "Internal staff time (allocated)",
    description:
      "Documented, reasonable allocation of staff time spent on AI governance; state the method in Notes.",
  },
  {
    name: "Other",
    description:
      "Anything else the organization considers AI governance spending; explain in Purpose.",
  },
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number]["name"];
export const SPEND_CATEGORY_NAMES: readonly string[] = SPEND_CATEGORIES.map(
  (c) => c.name
);

export const SPEND_RECORD_NOTICE =
  "This record is the organization's own unaudited documentation of AI governance spending. It is not accounting, tax, legal, or insurance advice, and it is not an audit, certification, assurance, or verification by Paladin Compliance or any third party. Figures are only as accurate as the entries the organization makes and the invoices it keeps.";

export const SPEND_RECORD_CSV_COLUMNS = [
  "Date (YYYY-MM-DD)",
  "Category",
  "Vendor / Payee",
  "Purpose",
  "Amount (USD)",
  "One-time / Recurring",
  "Invoice or reference",
  "Approved by",
  "Notes",
] as const;

export type SpendEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  vendor: string;
  purpose: string;
  amount: number; // USD
  recurrence: "One-time" | "Recurring";
  reference: string;
  approvedBy: string;
  notes: string;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string): Date | null {
  const m = DATE_RE.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Accepts "1,234.50", "$1234", "  12 " ; returns null for invalid/negative. */
export function parseAmount(value: string | number): number | null {
  const n =
    typeof value === "number"
      ? value
      : Number(value.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function addMonthsUtc(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate())
  );
}

export type SpendSummary = {
  fiscalYearStart: string;
  fiscalYearEnd: string;
  rows: {
    category: string;
    quarters: [number, number, number, number];
    total: number;
    share: number;
    entries: number;
  }[];
  total: number;
  entryCount: number;
  recurringTotal: number;
  oneTimeTotal: number;
  /** entries that could not be placed in this fiscal year or category */
  outsideOrInvalid: number;
};

export function summarizeSpend(
  entries: SpendEntry[],
  fiscalYearStart: string
): SpendSummary | null {
  const start = parseIsoDate(fiscalYearStart);
  if (!start) return null;
  const end = addMonthsUtc(start, 12);
  const rows = SPEND_CATEGORY_NAMES.map((category) => ({
    category,
    quarters: [0, 0, 0, 0] as [number, number, number, number],
    total: 0,
    share: 0,
    entries: 0,
  }));
  let recurringTotal = 0;
  let oneTimeTotal = 0;
  let placed = 0;

  for (const entry of entries) {
    const date = parseIsoDate(entry.date);
    const row = rows.find((r) => r.category === entry.category);
    if (
      !date ||
      !row ||
      !(entry.amount >= 0) ||
      date < start ||
      date >= end
    ) {
      continue;
    }
    let q = 0;
    for (let i = 3; i >= 0; i -= 1) {
      if (date >= addMonthsUtc(start, i * 3)) {
        q = i;
        break;
      }
    }
    row.quarters[q] = Math.round((row.quarters[q] + entry.amount) * 100) / 100;
    row.total = Math.round((row.total + entry.amount) * 100) / 100;
    row.entries += 1;
    placed += 1;
    if (entry.recurrence === "Recurring") {
      recurringTotal = Math.round((recurringTotal + entry.amount) * 100) / 100;
    } else {
      oneTimeTotal = Math.round((oneTimeTotal + entry.amount) * 100) / 100;
    }
  }

  const total = Math.round(rows.reduce((s, r) => s + r.total, 0) * 100) / 100;
  for (const r of rows) r.share = total === 0 ? 0 : r.total / total;

  return {
    fiscalYearStart,
    fiscalYearEnd: new Date(end.getTime() - 86400000).toISOString().slice(0, 10),
    rows,
    total,
    entryCount: placed,
    recurringTotal,
    oneTimeTotal,
    outsideOrInvalid: entries.length - placed,
  };
}

function csvCell(value: string | number) {
  let text = String(value);
  // Neutralize spreadsheet formula injection for text cells.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function spendEntriesToCsv(entries: SpendEntry[]): string {
  const lines = [SPEND_RECORD_CSV_COLUMNS.map(csvCell).join(",")];
  for (const e of entries) {
    lines.push(
      [
        e.date,
        e.category,
        e.vendor,
        e.purpose,
        e.amount.toFixed(2),
        e.recurrence,
        e.reference,
        e.approvedBy,
        e.notes,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function spendStatement(
  organizationName: string,
  summary: SpendSummary
) {
  return `For the fiscal year ${summary.fiscalYearStart} to ${summary.fiscalYearEnd}, ${organizationName} recorded ${formatUsd(summary.total)} in AI governance spending across ${summary.entryCount} ${summary.entryCount === 1 ? "entry" : "entries"}. This is the organization's own unaudited record, kept with supporting invoices.`;
}
