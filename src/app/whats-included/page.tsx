import Link from "next/link";
import { DISCLAIMER_SHORT } from "@/lib/paladin/copy";

export const metadata = {
  title: "What's Included",
  description:
    "What is in the Paladin AI Policy & Evidence Binder: physical binder, digital resources, public registry record, and annual updates. Documentation only; not certification.",
  alternates: {
    canonical: "/whats-included",
  },
};

const physicalItems = [
  "Initial physical AI Policy & Evidence Binder included with new memberships",
  "Tabbed structure for fast executive and administrative review",
  "Document-control presentation suitable for leadership files",
  "Organized artifact for insurance, client, and board files",
  "Core printed reference set for day-to-day administrative use",
];

const digitalItems = [
  "Member workspace access during an active subscription",
  "Quick-reference record (13-page PDF), a short digital companion; the full binder is the printed copy and is not offered as a download",
  "Registry record (PDF), QR files, and AI spend record templates (spreadsheet and CSV)",
  "AI spend record you can save to your account, with annual summary (CSV and printable)",
  "Operational plans only: short AI usage training modules with completion records",
];

const verificationItems = [
  "Public registry record showing this binder was issued to this organization",
  "QR code on the binder that opens the registry record",
  "Registry ID and active-through dates",
  "Registry record (PDF) and QR downloads to share with a broker or client",
];

const updateItems = [
  "Binder revisions released by Paladin are announced by email and listed in a revision log in your workspace",
  "Renewal reminder email about 30 days before renewal",
  "Registry record stays active while the plan is current",
  "No fixed revision schedule is promised; physical replacement pages are not included",
];

const controlItems = [
  {
    label: "Insurance renewals",
    value:
      "One organized place for the AI use policy sections and annual AI governance spend record a broker or underwriter may ask about. It does not change coverage or cure any policy exclusion.",
  },
  {
    label: "Client questionnaires",
    value:
      "A reference point when a client's security questionnaire asks what your organization has written down about AI use.",
  },
  {
    label: "Board and budget records",
    value:
      "A documented record of what the organization spends on AI compliance resources each year: \u201Cwe spent $X on AI compliance this year.\u201D It is a documented gesture that supports, and does not replace, responsible AI use.",
  },
];

export default function WhatsIncludedPage() {
  return (
    <main className="min-h-[calc(100vh-8rem)] max-w-full overflow-x-hidden bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-slate-950 px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
              AI Policy &amp; Evidence Binder
            </p>
            <h1 className="mt-5 max-w-4xl break-words text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              What&apos;s included with Paladin Compliance
            </h1>
            <p className="mt-5 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg">
              A tangible binder for insurance renewals, client security
              questionnaires, and board or budget records, with digital
              resources, a QR-linked public registry record, and annual
              updates during active subscription periods.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              className="inline-flex justify-center rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
              href="/pricing"
            >
              View Pricing
            </Link>
            <Link
              className="inline-flex justify-center rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-200/15"
              href="/sample"
            >
              See Sample Contents
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="min-w-0 rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-6 shadow-[0_22px_70px_rgba(2,6,23,0.26)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">
              What Arrives Physically
            </p>
            <h2 className="mt-3 break-words text-2xl font-black text-white">
              A tangible, organized record
            </h2>
            <p className="mt-4 break-words text-sm leading-7 text-slate-300">
              New memberships include an initial physical Paladin Compliance
              binder. It gives leadership and administrators a polished,
              organized reference they can keep on hand for review,
              onboarding, and internal accountability conversations.
            </p>
            <ul className="mt-6 grid gap-3">
              {physicalItems.map((item) => (
                <li
                  className="break-words border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid min-w-0 gap-6">
            <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.28)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
                Public Registry Record
              </p>
              <h2 className="mt-3 break-words text-2xl font-black text-white">
                Publicly viewable record of issuance
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {verificationItems.map((item) => (
                  <li
                    className="break-words border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0 sm:[&:nth-child(-n+2)]:border-t-0"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.28)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
                What Remains Digital
              </p>
              <h2 className="mt-3 break-words text-2xl font-black text-white">
                Member files and updateable resources
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {digitalItems.map((item) => (
                  <li
                    className="break-words border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0 sm:[&:nth-child(-n+2)]:border-t-0"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 break-words text-sm leading-7 text-slate-300">
                The digital quick-reference record summarizes the binder&apos;s policy
                sections; it does not contain the full binder. The HIPAA
                add-on currently adds a HIPAA label to the registry record only;
                HIPAA-oriented policy content is not yet included, and nothing
                here is legal certification or a regulatory guarantee.
              </p>
            </section>
          </section>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/80 px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <section className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
              Updates And Continuity
            </p>
            <h2 className="mt-3 max-w-3xl break-words text-3xl font-black text-white">
              Updates that stay current
            </h2>
            <p className="mt-4 max-w-3xl break-words text-sm leading-7 text-slate-300">
              An active subscription includes updates over time, with focused section
              replacements when the record changes.
            </p>
          </section>

          <ul className="grid gap-3">
            {updateItems.map((item) => (
              <li
                className="break-words border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-6 lg:grid-cols-3">
          {controlItems.map((item) => (
            <article
              className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.26)]"
              key={item.label}
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Used for
              </p>
              <h3 className="mt-3 break-words text-xl font-black text-white">
                {item.label}
              </h3>
              <p className="mt-3 break-words text-sm leading-7 text-slate-300">
                {item.value}
              </p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-7xl rounded-2xl border border-slate-400/20 bg-slate-400/10 p-6">
          <p className="break-words text-sm font-semibold leading-7 text-slate-300">
            {DISCLAIMER_SHORT} The registry record is issued by Paladin
            Compliance itself: it shows a binder was issued to an
            organization and says nothing about how that organization uses AI.
            Organizations remain responsible for following their own policies
            and the law.
          </p>
        </div>
      </section>
    </main>
  );
}
