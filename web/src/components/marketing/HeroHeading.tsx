"use client";

import { Typewriter } from "@/components/ui/typewriter";

export function HeroHeading() {
  return (
    <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight text-white sm:text-6xl lg:text-7xl">
      Agentic covenant
      <span className="block min-h-[2.3em]">
        <Typewriter
          text={[
            "monitoring on Casper",
            "breach detection",
            "x402 evidence rails",
            "policy-driven escrow",
            "RWA servicing OS",
          ]}
          speed={55}
          deleteSpeed={35}
          waitTime={2200}
          className="text-white/40"
          cursorChar="_"
          cursorClassName="ml-0.5 text-white/30"
        />
      </span>
    </h1>
  );
}
