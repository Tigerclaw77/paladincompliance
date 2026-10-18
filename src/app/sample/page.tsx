import type { Metadata } from "next";
import Link from "next/link";
import {
  DISCLAIMER_SHORT,
  PRODUCT_NAME,
  REGISTRY_DEFINITION,
  SAMPLE_TOC,
} from "@/lib/paladin/copy";

export const metadata: Metadata = {
  title: "Sample Contents",
  description:
    "See the table of contents of the Paladin AI Policy & Evidence Binder and a sample public registry record. Sample data is fictitious.",
  alternates: { canonical: "/sample" },
};

export default function SamplePage() {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-4 py-12 text-white sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            Sample contents
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            What&apos;s inside the {PRODUCT_NAME}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            The binder is organized so you can hand a broker, a client, or a
            board member one document that shows the AI use policy,
            oversight and escalation steps, and annual AI governance spend your
            organization keeps on record.
          </p>
          <p className="mt-4 max-w-3xl rounded-lg border border-amber-200/25 bg-amber-200/[0.07] p-4 text-sm leading-6 text-amber-100">
            {DISCLAIMER_SHORT}
          </p>
        </header>

        <section
          aria-label="Binder table of contents"
          className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 sm:p-8"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Table of contents (sample outline)
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {SAMPLE_TOC.map((group) => (
              <div key={group.part}>
                <h2 className="text-lg font-black text-white">{group.part}</h2>
                <ul className="mt-3 grid gap-2">
                  {group.items.map((item) => (
                    <li
                      className="border-t border-white/10 pt-2 text-sm leading-6 text-slate-200 first:border-t-0 first:pt-0"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-5 text-slate-400">
            Outline of the current binder structure. Section titles are
            abbreviated here and the binder may be revised over time.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Sample registry / QR lookup
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            The public registry record
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {REGISTRY_DEFINITION} Each binder carries a QR code that opens the
            record. The page is a record of issuance only.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            The example uses a fictitious organization and made-up data. It is
            not a real customer.
          </p>
          <Link
            className="mt-5 inline-flex rounded-lg border border-amber-200/30 bg-amber-200/10 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-200/15"
            href="/sample/registry"
          >
            View the sample registry record
          </Link>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 text-sm font-black text-white"
            href="/pricing"
          >
            View pricing
          </Link>
          <Link
            className="inline-flex rounded-lg border border-white/15 px-4 py-3 text-sm font-black text-white"
            href="/whats-included"
          >
            What&apos;s included
          </Link>
        </div>
      </div>
    </main>
  );
}
