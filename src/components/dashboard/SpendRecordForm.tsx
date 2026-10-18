"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  SPEND_CATEGORY_NAMES,
  SPEND_RECORD_NOTICE,
  formatUsd,
  parseAmount,
  parseIsoDate,
  spendEntriesToCsv,
  spendStatement,
  summarizeSpend,
  type SpendEntry,
} from "@/lib/paladin/spendRecord";

type Props = {
  organizationName: string;
  storageKey: string;
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-300/50 focus:outline-none";

function defaultFiscalYearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStored(storageKey: string): string {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStored(storageKey: string, value: string) {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    // storage unavailable (private mode): entries stay in memory only
  }
  listeners.forEach((l) => l());
}

export default function SpendRecordForm({ organizationName, storageKey }: Props) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readStored(storageKey),
    () => ""
  );
  const stored = useMemo(() => {
    if (!raw) return { entries: [] as SpendEntry[], fiscalYearStart: "" };
    try {
      const parsed = JSON.parse(raw) as {
        entries?: SpendEntry[];
        fiscalYearStart?: string;
      };
      return {
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        fiscalYearStart: parsed.fiscalYearStart ?? "",
      };
    } catch {
      return { entries: [] as SpendEntry[], fiscalYearStart: "" };
    }
  }, [raw]);
  const entries = stored.entries;
  const fiscalYearStart = stored.fiscalYearStart || defaultFiscalYearStart();

  const [draft, setDraft] = useState({
    date: "",
    category: SPEND_CATEGORY_NAMES[0],
    vendor: "",
    purpose: "",
    amount: "",
    recurrence: "One-time" as SpendEntry["recurrence"],
    reference: "",
    approvedBy: "",
    notes: "",
  });
  const [error, setError] = useState("");

  function persist(nextEntries: SpendEntry[], nextStart: string) {
    writeStored(
      storageKey,
      JSON.stringify({ entries: nextEntries, fiscalYearStart: nextStart })
    );
  }

  const summary = useMemo(
    () => summarizeSpend(entries, fiscalYearStart),
    [entries, fiscalYearStart]
  );

  function addEntry(event: React.FormEvent) {
    event.preventDefault();
    const amount = parseAmount(draft.amount);
    if (!parseIsoDate(draft.date)) {
      setError("Enter the date as YYYY-MM-DD.");
      return;
    }
    if (amount === null) {
      setError("Enter a valid, non-negative amount in USD.");
      return;
    }
    if (draft.purpose.trim().length < 3 || draft.vendor.trim().length < 1) {
      setError("Vendor and purpose are required.");
      return;
    }
    setError("");
    const entry: SpendEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: draft.date.trim(),
      category: draft.category,
      vendor: draft.vendor.trim(),
      purpose: draft.purpose.trim(),
      amount,
      recurrence: draft.recurrence,
      reference: draft.reference.trim(),
      approvedBy: draft.approvedBy.trim(),
      notes: draft.notes.trim(),
    };
    persist([...entries, entry], fiscalYearStart);
    setDraft({ ...draft, vendor: "", purpose: "", amount: "", reference: "", notes: "" });
  }

  function downloadCsv() {
    const blob = new Blob([spendEntriesToCsv(entries)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-governance-expenditure-log-${fiscalYearStart}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-4 text-xs leading-5 text-amber-100">
        {SPEND_RECORD_NOTICE}{" "}
        Entries on this page are saved only in this browser. Export the CSV to
        keep a copy; Paladin does not store or review these figures.
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
        <h2 className="text-lg font-black text-white">Add an expenditure</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addEntry}>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Date
            <input
              className={inputClass}
              inputMode="numeric"
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              placeholder="YYYY-MM-DD"
              value={draft.date}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Category
            <select
              className={inputClass}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              value={draft.category}
            >
              {SPEND_CATEGORY_NAMES.map((name) => (
                <option className="text-black" key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Vendor / payee
            <input
              className={inputClass}
              onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
              value={draft.vendor}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Amount (USD)
            <input
              className={inputClass}
              inputMode="decimal"
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              placeholder="0.00"
              value={draft.amount}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300 sm:col-span-2">
            Purpose
            <input
              className={inputClass}
              onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
              value={draft.purpose}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            One-time / recurring
            <select
              className={inputClass}
              onChange={(e) =>
                setDraft({ ...draft, recurrence: e.target.value as SpendEntry["recurrence"] })
              }
              value={draft.recurrence}
            >
              <option className="text-black">One-time</option>
              <option className="text-black">Recurring</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Invoice or reference
            <input
              className={inputClass}
              onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
              value={draft.reference}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Approved by
            <input
              className={inputClass}
              onChange={(e) => setDraft({ ...draft, approvedBy: e.target.value })}
              value={draft.approvedBy}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Notes
            <input
              className={inputClass}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              value={draft.notes}
            />
          </label>
          {error ? (
            <p className="text-sm font-bold text-red-300 sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <button
              className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-400"
              type="submit"
            >
              Add to log
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">
            Expenditure log ({entries.length})
          </h2>
          <button
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.09] disabled:opacity-40"
            disabled={entries.length === 0}
            onClick={downloadCsv}
            type="button"
          >
            Export CSV
          </button>
        </div>
        {entries.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No entries yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs text-slate-300">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Date</th>
                  <th className="pr-3">Category</th>
                  <th className="pr-3">Vendor</th>
                  <th className="pr-3">Purpose</th>
                  <th className="pr-3 text-right">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...entries]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((e) => (
                    <tr className="border-t border-white/10" key={e.id}>
                      <td className="py-2 pr-3">{e.date}</td>
                      <td className="pr-3">{e.category}</td>
                      <td className="pr-3">{e.vendor}</td>
                      <td className="pr-3">{e.purpose}</td>
                      <td className="pr-3 text-right">{formatUsd(e.amount)}</td>
                      <td>
                        <button
                          className="text-slate-500 underline hover:text-red-300"
                          onClick={() =>
                            persist(
                              entries.filter((x) => x.id !== e.id),
                              fiscalYearStart
                            )
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-black text-white">Annual summary</h2>
          <label className="grid gap-1 text-xs font-bold text-slate-300">
            Fiscal year start
            <input
              className={`${inputClass} w-40`}
              onChange={(e) => persist(entries, e.target.value)}
              value={fiscalYearStart}
            />
          </label>
        </div>
        {!summary ? (
          <p className="mt-4 text-sm text-red-300">
            Enter the fiscal year start as YYYY-MM-DD.
          </p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs text-slate-300">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Category</th>
                    <th className="pr-3 text-right">Q1</th>
                    <th className="pr-3 text-right">Q2</th>
                    <th className="pr-3 text-right">Q3</th>
                    <th className="pr-3 text-right">Q4</th>
                    <th className="pr-3 text-right">Total</th>
                    <th className="text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((row) => (
                    <tr className="border-t border-white/10" key={row.category}>
                      <td className="py-2 pr-3">{row.category}</td>
                      {row.quarters.map((q, i) => (
                        <td className="pr-3 text-right" key={i}>
                          {formatUsd(q)}
                        </td>
                      ))}
                      <td className="pr-3 text-right font-bold text-white">
                        {formatUsd(row.total)}
                      </td>
                      <td className="text-right">{(row.share * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/20 font-black text-white">
                    <td className="py-2 pr-3">Total</td>
                    <td colSpan={4} />
                    <td className="pr-3 text-right">{formatUsd(summary.total)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Recurring {formatUsd(summary.recurringTotal)} / one-time{" "}
              {formatUsd(summary.oneTimeTotal)}.{" "}
              {summary.outsideOrInvalid > 0
                ? `${summary.outsideOrInvalid} entr${summary.outsideOrInvalid === 1 ? "y falls" : "ies fall"} outside this fiscal year.`
                : ""}
            </p>
            <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-200">
              {spendStatement(organizationName, summary)}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
