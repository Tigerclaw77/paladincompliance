import SpendRecordForm from "@/components/dashboard/SpendRecordForm";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";

export const metadata = {
  title: "AI Governance Spend Record",
};

export default async function SpendRecordPage() {
  const { organization } = await getCurrentOrganization();

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Spend Record
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Annual AI governance expenditure record
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
          Document what {organization.name} spends on AI governance by
          category, date, vendor, amount, and purpose, with an annual summary.
          The same record is included in your binder as a printable form, and
          as a spreadsheet template.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          <a
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-slate-200 hover:bg-white/[0.09]"
            download
            href="/templates/Paladin_AI_Governance_Expenditure_Record.xlsx"
          >
            Download spreadsheet template (.xlsx)
          </a>
          <a
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-slate-200 hover:bg-white/[0.09]"
            download
            href="/templates/Paladin_AI_Governance_Expenditure_Log.csv"
          >
            Blank log (.csv)
          </a>
        </div>
      </header>
      <SpendRecordForm
        organizationName={organization.name}
        storageKey={`paladin:spend-record:${organization.id}`}
      />
    </div>
  );
}
