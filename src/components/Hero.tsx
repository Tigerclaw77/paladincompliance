"use client";

import { useEffect, useState } from "react";

const stakeholders = [
  "patients",
  "customers",
  "insurers",
  "regulators",
  "auditors",
  "investors",
  "team"
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % stakeholders.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="text-center py-24 px-6">
      <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
        Let your{" "}
        <span className="text-blue-600 transition-all">
          {stakeholders[index]}
        </span>{" "}
        know you take AI compliance seriously
      </h1>

      <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
        A simple system to organize your policies, track training, and show your
        organization is prepared.
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