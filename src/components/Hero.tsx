"use client";

import StakeholderDial from "./StakeholderDial";

export default function Hero() {
  return (
    <section className="text-center py-24 px-6">
      <h1 className="text-4xl font-bold text-center">
        Show your&nbsp;
        <StakeholderDial />
        &nbsp;you use AI responsibly
      </h1>

      <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
        A simple system to organize your policies, maintain records, and show
        your organization is prepared.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <a
          href="/pricing"
          className="px-6 py-3 rounded-md bg-black text-white hover:opacity-90"
        >
          Get Started
        </a>

        <a
          href="/pricing"
          className="px-6 py-3 rounded-md border hover:bg-gray-50"
        >
          View Pricing
        </a>
      </div>
    </section>
  );
}
