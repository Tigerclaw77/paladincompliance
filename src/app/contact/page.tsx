import Link from "next/link";
import { getSupportEmail } from "@/lib/paladin/env";

export const metadata = {
  title: "Contact",
  description:
    "Contact Paladin Compliance for support, sales questions, binder questions, and registry record assistance.",
  alternates: {
    canonical: "/contact",
  },
};

const contactReasons = [
  "Subscription, billing, or renewal questions",
  "Public registry record or QR asset support",
  "Binder fulfillment, replacement, or additional binder questions",
  "Plan fit, HIPAA materials add-on, or Enterprise review",
];

export default function ContactPage() {
  const supportEmail = getSupportEmail();

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-4 py-12 text-white sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.72fr]">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            Contact Paladin
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Support and binder questions
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            Use the Paladin contact address for service questions, sales
            conversations, binder coordination, and registry record support.
            Requests are answered by email. Paladin does not guarantee a
            response time.
          </p>

          <div className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">
              Email
            </p>
            <a
              className="mt-3 block break-all text-2xl font-black text-white underline-offset-4 hover:underline"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Include your organization name and the Paladin registry URL
              when the question relates to an active or pending record.
            </p>
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.28)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Common Reasons
          </p>
          <ul className="mt-5 grid gap-3">
            {contactReasons.map((reason) => (
              <li
                className="border-t border-white/10 py-3 text-sm font-semibold leading-6 text-slate-200 first:border-t-0"
                key={reason}
              >
                {reason}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3">
            <Link
              className="inline-flex justify-center rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
              href="/pricing"
            >
              View Pricing
            </Link>
            <Link
              className="inline-flex justify-center rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-200/15"
              href="/whats-included"
            >
              What&apos;s Included
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
