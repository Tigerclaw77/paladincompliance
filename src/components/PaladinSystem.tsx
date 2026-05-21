const qrPattern = [
  1, 1, 1, 0, 1, 0, 1,
  1, 0, 1, 0, 0, 1, 0,
  1, 1, 1, 0, 1, 1, 1,
  0, 0, 0, 1, 0, 0, 0,
  1, 0, 1, 1, 1, 0, 1,
  0, 1, 0, 0, 1, 1, 0,
  1, 0, 1, 0, 1, 0, 1,
];

const cards = [
  {
    step: "01",
    label: "Operational Record",
    headline: "Structured Physical Binder",
    subtext:
      "A maintained operational reference system with policies, records, logs, and verification materials.",
  },
  {
    step: "02",
    label: "External Signal",
    headline: "Public Verification Presence",
    subtext:
      "Show customers, partners, and auditors that your organization maintains documented AI governance practices.",
  },
  {
    step: "03",
    label: "Maintained Standing",
    headline: "Ongoing Membership & Updates",
    subtext:
      "Maintain active status, receive update eligibility, and keep your verification current as policies evolve.",
  },
];

export default function PaladinSystem() {
  return (
    <section
      aria-labelledby="paladin-system-title"
      className="relative isolate overflow-hidden bg-[#020817] px-6 py-20 text-white sm:py-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7c08a]/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(215,192,138,0.08),rgba(2,8,23,0)_24%),linear-gradient(90deg,rgba(215,192,138,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(215,192,138,0.035)_1px,transparent_1px)] bg-[size:auto,72px_72px,72px_72px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-white" />

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d7c08a]">
            Membership Lifecycle
          </p>
          <h2
            id="paladin-system-title"
            className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            The Paladin System
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            A guided membership ecosystem built around tangible records, visible
            verification, and ongoing governance maintenance.
          </p>
        </div>

        <div className="relative mt-14">
          <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-[#d7c08a]/45 to-transparent md:block" />

          <div className="grid gap-5 md:grid-cols-3">
            <SystemCard
              card={cards[0]}
              visual={<BinderVisual />}
            />
            <SystemCard
              card={cards[1]}
              visual={<VerificationVisual />}
            />
            <SystemCard
              card={cards[2]}
              visual={<MembershipVisual />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SystemCard({
  card,
  visual,
}: {
  card: (typeof cards)[number];
  visual: ReactNode;
}) {
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[8px] border border-white/[0.12] bg-[#081225]/92 shadow-[0_28px_80px_rgba(0,0,0,0.34)] transition duration-300 hover:-translate-y-1 hover:border-[#d7c08a]/45">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7c08a]/55 to-transparent opacity-70" />
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          {card.label}
        </span>
        <span className="grid size-9 place-items-center rounded-full border border-[#d7c08a]/35 bg-[#d7c08a]/10 text-xs font-bold text-[#f2dfad]">
          {card.step}
        </span>
      </div>

      <div className="px-5 pb-6 pt-5">
        {visual}

        <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
          {card.headline}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">{card.subtext}</p>
      </div>
    </article>
  );
}

function BinderVisual() {
  return (
    <div className="relative h-56 overflow-hidden rounded-[8px] border border-[#d7c08a]/16 bg-[linear-gradient(145deg,rgba(215,192,138,0.14),rgba(15,23,42,0.52)_38%,rgba(2,8,23,0.92))]">
      <div className="absolute inset-x-8 bottom-8 h-3 rounded-full bg-black/30 blur-md" />
      <div className="absolute left-1/2 top-7 h-36 w-28 -translate-x-[42%] rotate-[-7deg] rounded-[6px] border border-[#d7c08a]/35 bg-[#0d1830] shadow-[0_18px_42px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-y-0 left-0 w-6 rounded-l-[6px] border-r border-[#d7c08a]/20 bg-[#050b17]" />
        <div className="absolute left-2 top-8 grid gap-3">
          <span className="size-2 rounded-full border border-[#d7c08a]/55 bg-[#d7c08a]/10" />
          <span className="size-2 rounded-full border border-[#d7c08a]/55 bg-[#d7c08a]/10" />
          <span className="size-2 rounded-full border border-[#d7c08a]/55 bg-[#d7c08a]/10" />
        </div>
        <div className="absolute left-9 right-4 top-8 h-px bg-[#d7c08a]/45" />
        <div className="absolute left-9 right-5 top-12 grid gap-2">
          <span className="h-1 rounded-full bg-white/25" />
          <span className="h-1 rounded-full bg-white/14" />
          <span className="h-1 rounded-full bg-white/14" />
        </div>
        <div className="absolute bottom-8 left-9 right-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f0dca5]">
            Paladin
          </p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-slate-400">
            Control Binder
          </p>
        </div>
      </div>

      <div className="absolute right-12 top-12 grid gap-2">
        {["POLICY", "LOGS", "VERIFY"].map((tab) => (
          <span
            className="rounded-r-[4px] border border-[#d7c08a]/25 bg-[#d7c08a]/12 px-2 py-1 text-[8px] font-bold tracking-[0.1em] text-[#f0dca5]"
            key={tab}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Controlled Reference
        </span>
        <span className="h-px w-12 bg-[#d7c08a]/45" />
      </div>
    </div>
  );
}

function VerificationVisual() {
  return (
    <div className="relative h-56 overflow-hidden rounded-[8px] border border-[#d7c08a]/16 bg-[linear-gradient(145deg,rgba(215,192,138,0.1),rgba(7,16,33,0.7)_44%,rgba(2,8,23,0.94))]">
      <div className="absolute left-1/2 top-6 w-[72%] -translate-x-1/2 rounded-[7px] border border-[#d7c08a]/35 bg-[#f8f4e8] p-3 text-[#101827] shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-[#8b6f2e]">
              Verification
            </p>
            <div className="mt-2 h-1.5 w-20 rounded-full bg-[#101827]" />
            <div className="mt-2 h-1 w-28 rounded-full bg-slate-300" />
          </div>
          <span className="rounded-full border border-emerald-700/30 bg-emerald-700/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Active
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
          <div className="grid size-14 grid-cols-7 gap-0.5 rounded-[4px] border border-slate-300 bg-white p-1">
            {qrPattern.map((cell, index) => (
              <span
                className={cell ? "bg-[#101827]" : "bg-transparent"}
                key={`${cell}-${index}`}
              />
            ))}
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Verification ID
            </p>
            <p className="mt-1 truncate text-[10px] font-black tracking-[0.12em] text-[#101827]">
              PAL-AI-0427
            </p>
            <div className="mt-2 grid gap-1.5">
              <span className="h-1 rounded-full bg-slate-300" />
              <span className="h-1 rounded-full bg-slate-200" />
              <span className="h-1 w-3/4 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#8b6f2e]/20 pt-2">
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Issued
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#8b6f2e]">
            Maintained
          </span>
        </div>
      </div>
    </div>
  );
}

function MembershipVisual() {
  return (
    <div className="relative h-56 overflow-hidden rounded-[8px] border border-[#d7c08a]/16 bg-[linear-gradient(145deg,rgba(215,192,138,0.12),rgba(13,24,48,0.68)_38%,rgba(2,8,23,0.95))]">
      <div className="absolute left-8 right-8 top-7 rounded-[7px] border border-white/12 bg-[#071225] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d7c08a]">
              Membership
            </p>
            <p className="mt-2 text-lg font-semibold text-white">Active</p>
          </div>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-200">
            Current
          </span>
        </div>

        <div className="mt-5 grid gap-2">
          <div className="flex items-center gap-2 rounded-[5px] border border-[#d7c08a]/20 bg-[#d7c08a]/10 px-3 py-2">
            <span className="size-2 rounded-full bg-[#d7c08a]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f2dfad]">
              Update Eligible
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-[5px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="size-2 rounded-full border border-slate-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
              Renewal Window
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-16 left-10 right-10 flex items-center justify-between">
        {[0, 1, 2].map((item) => (
          <div className="flex flex-1 items-center last:flex-none" key={item}>
            <span className="grid size-5 place-items-center rounded-full border border-[#d7c08a]/45 bg-[#d7c08a]/15 text-[9px] font-bold text-[#f2dfad]">
              {item + 1}
            </span>
            {item < 2 ? <span className="h-px flex-1 bg-[#d7c08a]/35" /> : null}
          </div>
        ))}
      </div>

      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Continuity Record
        </span>
        <span className="h-px w-12 bg-[#d7c08a]/45" />
      </div>
    </div>
  );
}
import type { ReactNode } from "react";
