"use client";

export default function PrintButton() {
  return (
    <button
      className="rounded-lg border border-slate-400 px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      Print or save as PDF
    </button>
  );
}
