"use client";

import StakeholderDial from "./StakeholderDial";

export default function Hero() {
  return (
    <section className="relative overflow-hidden text-center py-24 px-6 bg-[#020817]">
      {/* Atmospheric background shield */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/paladincompliance-bg.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center -180px",
          backgroundSize: "1250px",
          opacity: 0.2,
          filter: "none",
        }}
      />

      {/* subtle ambient radial lighting */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at center top, rgba(184,155,94,0.06), transparent 55%)",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10">
        <p className="text-[#b89b5e] tracking-[0.35em] text-sm font-semibold uppercase mb-8">
          Paladin Compliance
        </p>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.15] tracking-tight max-w-5xl mx-auto">
          Show your{" "}
          <span
            className="text-[#d7c08a] inline-flex items-center align-baseline whitespace-nowrap"
            style={{ wordBreak: "keep-all" }}
          >
            <StakeholderDial />
          </span>{" "}
          you use AI responsibly
        </h1>

        <p className="mt-8 text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
          A simple system to organize your policies, maintain records, and show
          your organization is prepared.
        </p>

        <div className="mt-12 flex justify-center gap-4 flex-wrap">
          <a
            href="/pricing"
            className="px-8 py-4 rounded-lg bg-[#d7c08a] text-black font-semibold hover:opacity-90 transition"
          >
            Get Started
          </a>

          <a
            href="/pricing"
            className="px-8 py-4 rounded-lg border border-white/15 text-white hover:bg-white/5 transition"
          >
            View Pricing
          </a>
        </div>
      </div>
    </section>
  );
}