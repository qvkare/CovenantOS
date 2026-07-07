"use client";

import type { ReactNode } from "react";

import { WalletButton } from "@/components/covenant/wallet-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClickWallet } from "@/lib/casper/click-context";

export function WalletWall({ children }: { children: ReactNode }) {
  return (
    <WalletGate
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Connect your wallet</CardTitle>
            <CardDescription>
              Sign in with CSPR.click to register facilities, approve policy
              actions, and view on-chain receipts.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <WalletButton />
          </div>
        </Card>
      }
    >
      {children}
    </WalletGate>
  );
}

export function WalletGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { signedIn, ready } = useClickWallet();

  if (!ready) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center text-sm text-white/50">
        Initializing CSPR.click…
      </div>
    );
  }

  if (!signedIn) {
    return (
      fallback ?? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="mb-4 text-sm text-white/50">
            Connect a wallet to continue.
          </p>
          <WalletButton />
        </div>
      )
    );
  }

  return children;
}
