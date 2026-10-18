import Link from "next/link";
import { getSupportEmail } from "@/lib/paladin/env";

export const metadata = {
  title: "Privacy",
  description:
    "How Paladin Compliance uses organization, billing, registry record, and support information for active services.",
  alternates: {
    canonical: "/privacy",
  },
};

const informationTypes = [
  "Organization and account information used to set up the workspace and registry record.",
  "Billing and subscription information needed to maintain the subscription and account standing.",
  "Registry-record-related operational information used for public registry records, QR assets, and controlled updates.",
  "Optional healthcare-related organizational information when HIPAA add-on services are selected.",
];

const useCases = [
  "Operating the Paladin workspace, public registry record page, and downloadable asset features.",
  "Managing billing, subscription lifecycle, renewal state, and customer support.",
  "Preparing registry record materials, operational updates, and controlled-document resources.",
  "Sending service-related email about an active subscription, binder revisions, renewal reminders, support, and account status.",
  "Storing AI spend record entries that an organization owner or admin chooses to save to the account, so members can view and export them. Entries kept only in the browser are not sent to Paladin.",
];

export default function PrivacyPage() {
  const supportEmail = getSupportEmail();

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-4 py-12 text-white sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            Paladin Compliance
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Privacy
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            This page describes the practical information Paladin uses to run
            the service. It is written for organizations evaluating or using
            the Paladin service, not as a dense corporate privacy manual.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.28)] sm:p-8">
          <h2 className="text-2xl font-black text-white">
            Information Organizations Provide
          </h2>
          <ul className="mt-5 grid gap-3">
            {informationTypes.map((item) => (
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
            How Paladin Uses Information
          </h2>
          <ul className="mt-5 grid gap-3">
            {useCases.map((item) => (
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
            title="Payment Processing"
            body="Stripe handles payment processing for Paladin subscriptions and binder purchases. Paladin uses Stripe records to manage account standing, billing portal access, and subscription lifecycle updates."
          />
          <PolicyNote
            title="Data Sale"
            body="Paladin does not sell customer data. Information provided to Paladin is used to operate, support, and maintain the services selected by the organization."
          />
          <PolicyNote
            title="Security"
            body="Paladin uses reasonable administrative, technical, and operational safeguards appropriate for a small professional software service. No internet service can promise perfect security."
          />
          <PolicyNote
            title="Service Email"
            body="Paladin may send email related to active services, support, account status, registry record lifecycle, operational updates, and renewal activity."
          />
        </section>

        <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-6">
          <h2 className="text-xl font-black text-white">Questions</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            For privacy questions or service-related requests, contact{" "}
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
