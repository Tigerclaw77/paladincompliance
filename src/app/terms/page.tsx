import Link from "next/link";
import { getSupportEmail } from "@/lib/paladin/env";

export const metadata = {
  title: "Terms",
  description:
    "Baseline terms for Paladin Compliance operational governance materials, verification services, subscriptions, and updates.",
  alternates: {
    canonical: "/terms",
  },
};

const serviceScope = [
  "Operational governance and reference materials for organizational use.",
  "Public verification pages, certificates, QR assets, and related downloadable materials.",
  "Physical binder materials and maintained digital resources available during active coverage.",
  "Optional HIPAA-oriented operational reference materials when selected by the organization.",
];

const organizationResponsibilities = [
  "Reviewing materials for fit with the organization's own workflows, obligations, and risk posture.",
  "Maintaining appropriate internal policies, procedures, training, oversight, and professional review.",
  "Using Paladin materials as operational references rather than legal advice or external certification.",
  "Keeping billing, organization profile, and verification information reasonably current.",
];

const subscriptionEffects = [
  "Active subscriptions support maintained verification status and ongoing update access.",
  "Cancellation, failed renewal, or nonpayment may move verification into renewal due or lapsed status.",
  "Lapsed verification means Paladin is no longer presenting the public record as actively maintained.",
  "Binder and digital materials may evolve over time as operational reference materials are maintained.",
];

export default function TermsPage() {
  const supportEmail = getSupportEmail();

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-4 py-12 text-white sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            Paladin Compliance
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Terms
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            These terms describe the baseline operating relationship for
            Paladin Compliance coverage, verification services, binder
            materials, and maintained digital resources.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.28)] sm:p-8">
          <h2 className="text-2xl font-black text-white">
            What Paladin Provides
          </h2>
          <ul className="mt-5 grid gap-3">
            {serviceScope.map((item) => (
              <li
                className="border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.28)] sm:p-8">
          <h2 className="text-2xl font-black text-white">
            Organization Responsibility
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Paladin provides operational governance and reference materials.
            Paladin does not provide legal advice, and verification does not
            guarantee regulatory compliance or approval by a government agency.
            Organizations remain responsible for their own legal, regulatory,
            professional, and operational obligations.
          </p>
          <ul className="mt-5 grid gap-3">
            {organizationResponsibilities.map((item) => (
              <li
                className="border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.28)] sm:p-8">
          <h2 className="text-2xl font-black text-white">
            Subscription And Verification Status
          </h2>
          <ul className="mt-5 grid gap-3">
            {subscriptionEffects.map((item) => (
              <li
                className="border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <PolicyNote
            title="Updates"
            body="Paladin may revise, replace, or expand binder sections, verification assets, and digital resources as the service evolves. Updated materials are part of the maintained service, not a promise that prior versions were defective."
          />
          <PolicyNote
            title="Reasonable Limits"
            body="To the extent permitted by law, Paladin is not responsible for indirect, incidental, special, consequential, or punitive damages. Paladin's total liability for service claims is limited to amounts paid to Paladin for the affected service period."
          />
        </section>

        <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-6">
          <h2 className="text-xl font-black text-white">Questions</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Questions about these terms can be sent to{" "}
            <a
              className="font-black text-amber-100 underline-offset-4 hover:underline"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
            .
          </p>
          <Link
            className="mt-5 inline-flex rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-3 text-sm font-black text-blue-100 transition hover:bg-blue-400/15"
            href="/contact"
          >
            Contact Paladin
          </Link>
        </section>
      </div>
    </main>
  );
}

function PolicyNote({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/88 p-6">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </article>
  );
}
