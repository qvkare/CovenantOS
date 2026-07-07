"use client";

import { useEffect, useState, type ReactNode } from "react";

export function MswProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(
    () => process.env.NEXT_PUBLIC_MSW !== "true",
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MSW !== "true") return;

    void import("./browser").then(({ worker }) =>
      worker
        .start({ onUnhandledRequest: "bypass", quiet: true })
        .then(() => setReady(true)),
    );
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/50">
        Starting demo API…
      </div>
    );
  }

  return children;
}
