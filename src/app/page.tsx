import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Link from "next/link";
import PaladinSystem from "@/components/PaladinSystem";
import {
  BINDER_USE_CASES,
  REGISTRY_DEFINITION,
  SPEND_RECORD_FRAMING,
  SUPPORTS_NOT_REPLACES,
} from "@/lib/paladin/copy";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <PaladinSystem />

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold">
          One binder for the three places AI questions come up
        </h2>

        <p className="mt-4 text-gray-600">
          Insurance renewals, client security questionnaires, and board or
          budget records all ask what your organization has written down about
          AI. The binder puts it in one organized place.
        </p>
        <ul className="mt-6 grid gap-2 text-gray-700">
          {BINDER_USE_CASES.map((item) => (
            <li key={item} className="font-semibold">{item}</li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">Policy &amp; evidence binder</h3>
          <p className="mt-2 text-gray-600">
            An organized AI use policy and written oversight, data-handling, and escalation procedures you can hand to a broker or client.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Annual spend record</h3>
          <p className="mt-2 text-gray-600">
            Document what you spend on AI governance by category, date, vendor, and purpose, with an annual summary.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Public registry record</h3>
          <p className="mt-2 text-gray-600">
            {REGISTRY_DEFINITION}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
          <h2 className="text-xl font-semibold">
            A documented record of what you spend on AI compliance
          </h2>
          <p className="mt-3 text-gray-700">{SPEND_RECORD_FRAMING}</p>
          <p className="mt-3 text-gray-700">{SUPPORTS_NOT_REPLACES}</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <Link className="underline" href="/sample">
              See sample contents
            </Link>
            <Link className="underline" href="/pricing">
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
