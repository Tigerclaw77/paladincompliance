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
  canWriteToAccount: boolean;
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

export default function SpendRecordForm({
  canWriteToAccount,
  organizationName,
  storageKey,
}: Props) {
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
  const [syncMessage, setSyncMessage] = useState("");
  const [syncing, setSyncing] = useState(false);

  async function saveToAccount() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const response = await fetch("/api/spend-record", {
        body: JSON.stringify({ entries }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        saved?: number;
      };
      setSyncMessage(
        response.ok
          ? `Saved ${body.saved ?? 0} entries to your account.`
          : body.error ?? "Could not save to your account."
      );
    } catch {
      setSyncMessage("Could not reach the server. Entries remain in this browser.");
    } finally {
      setSyncing(false);
    }
  }

  async function loadFromAccount() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const response = await fetch("/api/spend-record", { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as {
        entries?: SpendEntry[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(body.entries)) {
        setSyncMessage(body.error ?? "Could not load from your account.");
        return;
      }
      const merged = new Map(entries.map((e) => [e.id, e]));
      for (const e of body.entries) merged.set(e.id, e);
      persist([...merged.values()], fiscalYearStart);
      setSyncMessage(
        `Loaded ${body.entries.length} saved entries and merged them with this browser's entries.`
      );
    } catch {
      setSyncMessage("Could not reach the server.");
    } finally {
      setSyncing(false);
    }
  }

  function removeEntry(id: string) {
    persist(
      entries.filter((x) => x.id !== id),
      fiscalYearStart
    );
    if (canWriteToAccount) {
      // Best effort: also remove it from the saved account record if present.
      void fetch(`/api/spend-record?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch(() => undefined);
    }
  }

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
        Entries are kept in this browser until you choose Save to account,
        which stores them in your organization&apos;s Paladin account
        (owners and admins can save; all members can view and export).
        Paladin stores these figures but does not review or verify them.
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
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.09] disabled:opacity-40"
              disabled={entries.length === 0}
              onClick={downloadCsv}
              type="button"
            >
              Export CSV
            </button>
            <button
              className="rounded-lg border border-blue-300/30 bg-blue-400/10 px-3 py-2 text-sm font-bold text-blue-100 transition hover:bg-blue-400/20 disabled:opacity-40"
              disabled={syncing || !canWriteToAccount || entries.length === 0}
              onClick={saveToAccount}
              title={canWriteToAccount ? undefined : "Owners and admins can save to the account."}
              type="button"
            >
              Save to account
            </button>
            <button
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.09] disabled:opacity-40"
              disabled={syncing}
              onClick={loadFromAccount}
              type="button"
            >
              Load from account
            </button>
            <a
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.09]"
              href={`/dashboard/spend-record/annual?start=${fiscalYearStart}`}
            >
              Annual summary (print / CSV)
            </a>
          </div>
        </div>
        {syncMessage ? (
          <p className="mt-3 text-xs font-bold text-blue-100" role="status">
            {syncMessage}
          </p>
        ) : null}
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
                          onClick={() => removeEntry(e.id)}
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
