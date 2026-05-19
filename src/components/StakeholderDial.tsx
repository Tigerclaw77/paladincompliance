"use client";

import { useEffect, useRef } from "react";

const stakeholders = [
  "patients",
  "clients",
  "insurers",
  "auditors",
  "investors",
  "partners",
];

export default function StakeholderDial() {
  const reelRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);

  useEffect(() => {
    const reel = reelRef.current;
    if (!reel) return;

    const itemHeight =
      reel.firstElementChild instanceof HTMLElement
        ? reel.firstElementChild.offsetHeight
        : 24;

    const moveDuration = 600;
    const pauseDuration = 1200;

    const step = () => {
      if (positionRef.current >= stakeholders.length * 2) {
        reel.style.transition = "none";
        positionRef.current = stakeholders.length;
        reel.style.transform = `translateY(-${
          positionRef.current * itemHeight
        }px)`;

        reel.getBoundingClientRect();
      }

      positionRef.current += 1;

      reel.style.transition =
        "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
      reel.style.transform = `translateY(-${
        positionRef.current * itemHeight
      }px)`;

      setTimeout(step, pauseDuration + moveDuration);
    };

    positionRef.current = stakeholders.length;
    reel.style.transform = `translateY(-${
      positionRef.current * itemHeight
    }px)`;

    const timeout = setTimeout(step, 800);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <span className="relative inline-block h-[1.6em] -translate-y-[-1px] overflow-hidden align-middle mask-[linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]">
      <div ref={reelRef}>
        {[...stakeholders, ...stakeholders, ...stakeholders].map((word, i) => (
          <div
            className="min-w-[8ch] whitespace-nowrap bg-linear-to-b from-[#d6b36a] via-[#f0d78a] to-[#b8964a] bg-clip-text text-center font-semibold tracking-[-0.01em] text-transparent"
            key={`${word}-${i}`}
            style={{
              height: "1.6em",
              lineHeight: "1.6em",
            }}
          >
            {word}
          </div>
        ))}
      </div>
    </span>
  );
}
