import Link from "next/link";
import PrintButton from "@/components/dashboard/PrintButton";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import {
  SPEND_RECORD_NOTICE,
  formatUsd,
  parseIsoDate,
  spendRowToEntry,
  spendStatement,
  summarizeSpend,
} from "@/lib/paladin/spendRecord";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Annual AI spend summary" };

type PageProps = { searchParams: Promise<{ start?: string }> };

export default async function AnnualSpendSummaryPage({ searchParams }: PageProps) {
  const { organization } = await getCurrentOrganization();
  const params = await searchParams;
  const start =
    params.start && parseIsoDate(params.start)
      ? params.start
      : `${new Date().getUTCFullYear()}-01-01`;
  const startDate = parseIsoDate(start)!;
  const end = new Date(
    Date.UTC(startDate.getUTCFullYear() + 1, startDate.getUTCMonth(), startDate.getUTCDate())
  );
  const rows = await prisma.aiSpendEntry.findMany({
    orderBy: { entryDate: "asc" },
    where: {
      entryDate: { gte: startDate, lt: end },
      organizationId: organization.id,
    },
  });
  const entries = rows.map(spendRowToEntry);
  const summary = summarizeSpend(entries, start);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link
          className="text-sm font-bold text-blue-200 underline"
          href="/dashboard/spend-record"
        >
          Back to spend record
        </Link>
        <PrintButton />
        <a
          className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-slate-200"
          href={`/api/spend-record/export?kind=summary&start=${start}`}
        >
          Download summary CSV
        </a>
        <a
          className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-slate-200"
          href={`/api/spend-record/export?kind=log&start=${start}`}
        >
          Download entries CSV
        </a>
        <form className="flex items-center gap-2" method="get">
          <label className="text-xs font-bold text-slate-300" htmlFor="start">
            Fiscal year start
          </label>
          <input
            className="w-36 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1.5 text-sm text-white"
            defaultValue={start}
            id="start"
            name="start"
          />
          <button className="text-sm font-bold text-blue-200 underline" type="submit">
            Update
          </button>
        </form>
      </div>

      <article className="rounded-2xl bg-white p-8 text-slate-900">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Paladin Compliance - AI Policy &amp; Evidence Binder
        </p>
        <h1 className="mt-2 text-2xl font-black">
          Annual AI governance expenditure summary
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {organization.name} - saved account record
        </p>
        {summary ? (
          <>
            <p className="mt-4 text-sm leading-6">
              {spendStatement(organization.name, summary)}
            </p>
            <table className="mt-5 w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600">
                  <th className="py-1.5 pr-2">Category</th>
                  <th className="pr-2 text-right">Q1</th>
                  <th className="pr-2 text-right">Q2</th>
                  <th className="pr-2 text-right">Q3</th>
                  <th className="pr-2 text-right">Q4</th>
                  <th className="pr-2 text-right">Total</th>
                  <th className="text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row) => (
                  <tr className="border-b border-slate-200" key={row.category}>
                    <td className="py-1.5 pr-2">{row.category}</td>
                    {row.quarters.map((q, i) => (
                      <td className="pr-2 text-right" key={i}>
                        {formatUsd(q)}
                      </td>
                    ))}
                    <td className="pr-2 text-right font-bold">{formatUsd(row.total)}</td>
                    <td className="text-right">{(row.share * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="font-black">
                  <td className="py-1.5 pr-2">Total</td>
                  <td colSpan={4} />
                  <td className="pr-2 text-right">{formatUsd(summary.total)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-600">
              Recurring {formatUsd(summary.recurringTotal)}; one-time{" "}
              {formatUsd(summary.oneTimeTotal)}.
            </p>
            {entries.length === 0 && (
              <p className="mt-3 text-xs text-slate-600">
                No entries are saved to the account for this fiscal year. Save
                entries from the spend record page first.
              </p>
            )}
          </>
        ) : null}
        <p className="mt-6 border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">
          {SPEND_RECORD_NOTICE}
        </p>
      </article>
    </div>
  );
}
