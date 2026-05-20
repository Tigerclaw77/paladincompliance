"use client";

import AnimatedPaladinShield from "./AnimatedPaladinShield";
import StakeholderDial from "./StakeholderDial";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#020817] px-6 py-20 text-white sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(198,168,91,0.13),transparent_34%),radial-gradient(circle_at_18%_72%,rgba(59,130,246,0.08),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_420px]">
        <div className="text-center lg:text-left">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200/90">
            Paladin Compliance
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Show your&nbsp;
            <StakeholderDial />
            &nbsp;you use AI responsibly
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 lg:mx-0">
            A simple system to organize your policies, maintain records, and
            show your organization is prepared.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="/pricing"
              className="rounded-md bg-gradient-to-r from-[#c6a85b] to-[#e7d39f] px-6 py-3 font-black text-slate-950 transition hover:opacity-90"
            >
              Get Started
            </a>

            <a
              href="/pricing"
              className="rounded-md border border-white/15 px-6 py-3 font-black text-slate-100 transition hover:bg-white/[0.06]"
            >
              View Pricing
            </a>
          </div>
        </div>

        <div className="mx-auto flex w-full justify-center lg:justify-end">
          <AnimatedPaladinShield className="w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]" />
        </div>
      </div>
    </section>
  );
}
