import Link from "next/link";

export const metadata = {
  title: "What's Included",
  description:
    "Physical binder, digital resources, public verification assets, and update materials included with Paladin Compliance coverage.",
  alternates: {
    canonical: "/whats-included",
  },
};

const physicalItems = [
  "Initial physical binder included with new memberships",
  "Tabbed structure for fast executive and administrative review",
  "Document-control presentation suitable for leadership files",
  "Professional artifact for office, board, or review settings",
  "Core printed reference set for day-to-day administrative use",
];

const digitalItems = [
  "Member workspace access during active coverage",
  "Downloadable member files and support materials",
  "Current digital versions for materials that change more often",
  "HIPAA-oriented resources when the add-on is selected",
];

const verificationItems = [
  "Public verification page showing current standing",
  "QR-linked validation from binder or shared assets",
  "Verification ID and active-through details",
  "Certificate and QR downloads for stakeholder review",
];

const updateItems = [
  "Updates included during active subscription periods",
  "Focused replacement sections when needed",
  "Verification tied to active standing",
  "Versioned record over time",
  "HIPAA updates when selected",
];

const controlItems = [
  {
    label: "Visible seriousness",
    value:
      "A clear record gives stakeholders a quiet signal that AI use is being handled deliberately.",
  },
  {
    label: "Review readiness",
    value:
      "A structured reference point for leadership, vendor, and customer review conversations.",
  },
  {
    label: "Trust continuity",
    value:
      "Active standing keeps verification, QR assets, and update access aligned over time.",
  },
];

export default function WhatsIncludedPage() {
  return (
    <main className="min-h-[calc(100vh-8rem)] max-w-full overflow-x-hidden bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-slate-950 px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
              Paladin Coverage
            </p>
            <h1 className="mt-5 max-w-4xl break-words text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              What&apos;s included with Paladin Compliance
            </h1>
            <p className="mt-5 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg">
              Paladin coverage pairs a tangible binder with digital resources,
              QR-linked public verification, and update materials during active
              subscription periods.
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
              href="/dashboard"
            >
              Preview Public Verification
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
              A tangible professional record
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
                Public Verification
              </p>
              <h2 className="mt-3 break-words text-2xl font-black text-white">
                Externally reviewable standing
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
                Digital materials keep current files available without turning
                every resource into a printed packet. HIPAA-oriented
                resources are included when selected, without representing
                legal certification or a regulatory guarantee.
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
              Active coverage includes updates over time, with focused section
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
                Operational Value
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
            Paladin Compliance materials are operational governance references.
            They support consistency, visibility, and maintainability. They do
            not represent legal advice, government approval, external
            accreditation, or a guarantee of regulatory compliance.
          </p>
        </div>
      </section>
    </main>
  );
}
