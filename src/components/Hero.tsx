"use client";

import StakeholderDial from "./StakeholderDial";

export default function Hero() {
  return (
    <section className="relative overflow-hidden text-center py-24 px-6">

      {/* Atmospheric background shield */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "url('/paladincompliance-bg.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 10%",
          backgroundSize: "900px",
          filter: "blur(1px)",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10">
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
      </div>
    </section>
  );
}