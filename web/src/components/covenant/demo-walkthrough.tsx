"use client";

import { DEMO_FACILITY_IDS } from "@covenantos/shared";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetDemo } from "@/lib/api-client";

const STEPS = [
  "Reset demo state to a clean facility portfolio",
  "Open Atlas Receivables and run the breach check (x402 evidence)",
  "Connect CSPR.click wallet and approve the proposed hold",
  "Confirm escrow Held and on-chain txs in the audit trail",
] as const;

export function DemoWalkthrough() {
  const router = useRouter();

  const startMutation = useMutation({
    mutationFn: async () => {
      await resetDemo();
      return DEMO_FACILITY_IDS.breach;
    },
    onSuccess: (facilityId) => {
      toast.success("Demo reset — opening breach facility");
      router.push(`/facilities/${facilityId}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="border-emerald-400/20 bg-emerald-400/[0.04]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">Live demo walkthrough</CardTitle>
            <CardDescription>
              Run the full covenant breach → officer approval → escrow hold flow on
              Casper testnet without curl or CLI.
            </CardDescription>
          </div>
          <Button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="gap-2"
          >
            {startMutation.isPending ? (
              "Resetting…"
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start live demo
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2 text-sm text-white/70">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="font-mono text-xs text-emerald-300/80">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/facilities/${DEMO_FACILITY_IDS.breach}`}>
              Open demo facility
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-white/50"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            <RotateCcw className="h-3 w-3" />
            Reset demo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
