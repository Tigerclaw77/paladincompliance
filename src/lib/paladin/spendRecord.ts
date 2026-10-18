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

// ---------------------------------------------------------------------------
// Account-level persistence helpers (pure; used by the /api/spend-record routes
// and tests). Money is stored as integer cents.
// ---------------------------------------------------------------------------

export const SPEND_FIELD_LIMITS = {
  clientId: 64,
  vendor: 200,
  purpose: 500,
  reference: 200,
  approvedBy: 200,
  notes: 1000,
  maxBatch: 500,
  maxEntriesPerOrganization: 5000,
  maxAmount: 1_000_000_000,
} as const;

export type SpendEntryInput = {
  clientId: string;
  date: string;
  category: string;
  vendor: string;
  purpose: string;
  amountCents: number;
  recurrence: "One-time" | "Recurring";
  reference: string;
  approvedBy: string;
  notes: string;
};

export type SpendEntryParseResult =
  | { ok: true; value: SpendEntryInput }
  | { ok: false; error: string };

function textField(raw: unknown, max: number): string | null {
  if (raw === undefined || raw === null) return "";
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length <= max ? trimmed : null;
}

/** Validates one client-supplied entry. Never trusts types, lengths or ids. */
export function parseSpendEntryInput(raw: unknown): SpendEntryParseResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Entry must be an object." };
  }
  const r = raw as Record<string, unknown>;
  const clientId = typeof r.id === "string" ? r.id : r.clientId;

  if (
    typeof clientId !== "string" ||
    !/^[A-Za-z0-9_-]+$/.test(clientId) ||
    clientId.length > SPEND_FIELD_LIMITS.clientId
  ) {
    return { ok: false, error: "Entry id is missing or invalid." };
  }
  if (typeof r.date !== "string" || !parseIsoDate(r.date)) {
    return { ok: false, error: "Date must be YYYY-MM-DD." };
  }
  if (typeof r.category !== "string" || !SPEND_CATEGORY_NAMES.includes(r.category)) {
    return { ok: false, error: "Unknown category." };
  }
  const amount =
    typeof r.amount === "number" || typeof r.amount === "string"
      ? parseAmount(r.amount)
      : null;
  if (amount === null || amount > SPEND_FIELD_LIMITS.maxAmount) {
    return { ok: false, error: "Amount must be a non-negative USD figure." };
  }
  const vendor = textField(r.vendor, SPEND_FIELD_LIMITS.vendor);
  const purpose = textField(r.purpose, SPEND_FIELD_LIMITS.purpose);
  const reference = textField(r.reference, SPEND_FIELD_LIMITS.reference);
  const approvedBy = textField(r.approvedBy, SPEND_FIELD_LIMITS.approvedBy);
  const notes = textField(r.notes, SPEND_FIELD_LIMITS.notes);
  if (vendor === null || purpose === null || reference === null || approvedBy === null || notes === null) {
    return { ok: false, error: "A text field is too long or not text." };
  }
  if (vendor.length < 1 || purpose.length < 3) {
    return { ok: false, error: "Vendor and purpose are required." };
  }
  const recurrence = r.recurrence === "Recurring" ? "Recurring" : "One-time";

  return {
    ok: true,
    value: {
      clientId,
      date: r.date.trim(),
      category: r.category,
      vendor,
      purpose,
      amountCents: Math.round(amount * 100),
      recurrence,
      reference,
      approvedBy,
      notes,
    },
  };
}

/** Only owners and admins may change the organization's spend record. */
export function canWriteSpendRecords(role: string | null | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function spendRowToEntry(row: {
  clientId: string;
  entryDate: Date;
  category: string;
  vendor: string;
  purpose: string;
  amountCents: number;
  recurrence: string;
  reference: string;
  approvedBy: string;
  notes: string;
}): SpendEntry {
  return {
    id: row.clientId,
    date: row.entryDate.toISOString().slice(0, 10),
    category: row.category,
    vendor: row.vendor,
    purpose: row.purpose,
    amount: row.amountCents / 100,
    recurrence: row.recurrence === "Recurring" ? "Recurring" : "One-time",
    reference: row.reference,
    approvedBy: row.approvedBy,
    notes: row.notes,
  };
}

/** CSV of the annual summary (category x quarter), for the annual export. */
export function annualSummaryToCsv(
  organizationName: string,
  summary: SpendSummary
): string {
  const lines: string[] = [];
  lines.push(
    ["Organization", organizationName].map(csvCell).join(","),
    ["Fiscal year", `${summary.fiscalYearStart} to ${summary.fiscalYearEnd}`]
      .map(csvCell)
      .join(","),
    "",
    ["Category", "Q1", "Q2", "Q3", "Q4", "Total (USD)", "Share"]
      .map(csvCell)
      .join(",")
  );
  for (const row of summary.rows) {
    lines.push(
      [
        row.category,
        ...row.quarters.map((q) => q.toFixed(2)),
        row.total.toFixed(2),
        `${(row.share * 100).toFixed(1)}%`,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  lines.push(
    ["Total", "", "", "", "", summary.total.toFixed(2), ""].map(csvCell).join(","),
    "",
    ["Recurring total", summary.recurringTotal.toFixed(2)].map(csvCell).join(","),
    ["One-time total", summary.oneTimeTotal.toFixed(2)].map(csvCell).join(","),
    ["Entries counted", summary.entryCount].map(csvCell).join(","),
    [
      "Note",
      "Organization's own unaudited record. Not accounting, tax, legal or insurance advice.",
    ]
      .map(csvCell)
      .join(",")
  );
  return `${lines.join("\r\n")}\r\n`;
}
