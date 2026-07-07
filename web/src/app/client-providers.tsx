"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { ClickProvider } from "@/lib/casper/click-context";
import { MswProvider } from "@/mocks/msw-provider";

export function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClickProvider>
        <MswProvider>{children}</MswProvider>
      </ClickProvider>
    </QueryClientProvider>
  );
}
