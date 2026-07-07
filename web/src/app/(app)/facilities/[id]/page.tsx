"use client";

import { DEMO_FACILITY_IDS } from "@covenantos/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AgentActivityFeed } from "@/components/covenant/agent-activity-feed";
import { CovenantStatusBadge } from "@/components/covenant/covenant-status-badge";
import { EvidenceCard } from "@/components/covenant/evidence-card";
import { LiveBanner } from "@/components/covenant/live-banner";
import { PageHeader } from "@/components/covenant/page-header";
import { TxLink } from "@/components/covenant/tx-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveEvents } from "@/hooks/use-live-events";
import { getFacility, listActions, triggerFacilityCheck } from "@/lib/api-client";
import { formatMotes } from "@/lib/format";

const MIN_EVIDENCE_FOR_HOLD = 2;
const DEMO_BREACH_ID = DEMO_FACILITY_IDS.breach;

export default function FacilityDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { events, connected } = useLiveEvents();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isDemoBreachFacility = id === DEMO_BREACH_ID;

  const { data, isLoading, error } = useQuery({
    queryKey: ["facility", id],
    queryFn: () => getFacility(id),
    enabled: Boolean(id),
  });

  const { data: pendingActions } = useQuery({
    queryKey: ["actions", "pending"],
    queryFn: () => listActions("pending"),
  });

  const facilityPending =
    pendingActions?.actions.filter((a) => a.facilityId === id) ?? [];

  const checkMutation = useMutation({
    mutationFn: () => triggerFacilityCheck(id),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["facility", id] });
      void queryClient.invalidateQueries({ queryKey: ["facilities"] });
      void queryClient.invalidateQueries({ queryKey: ["actions"] });

      if (res.status === "breach" && res.action) {
        toast.success("Hold proposed — officer approval required", {
          action: {
            label: "Go to Approvals",
            onClick: () => router.push("/approvals"),
          },
        });
        setBannerDismissed(false);
      } else if (res.status === "breach") {
        toast.message("Breach detected — evidence recorded", {
          description: `Run check again after ${MIN_EVIDENCE_FOR_HOLD} independent evidence items are collected.`,
        });
        setBannerDismissed(false);
      } else if (res.status === "release_pending") {
        toast.success("Remediation check passed — release proposed", {
          action: {
            label: "Go to Approvals",
            onClick: () => router.push("/approvals"),
          },
        });
      } else {
        toast.success("Covenant check complete — all covenants within threshold");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const breachEvents = events.filter(
    (e) => e.type === "BreachDetected" && e.facilityId === id,
  );
  const showBanner =
    !bannerDismissed &&
    (data?.facility.status === "breach" ||
      breachEvents.length > 0 ||
      facilityPending.length > 0);

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facility not found</CardTitle>
          <CardDescription>{(error as Error)?.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { facility, covenants, evidence, escrow } = data;
  const evidenceNeeded = Math.max(0, MIN_EVIDENCE_FOR_HOLD - evidence.length);

  return (
    <>
      <div className="space-y-8">
        {showBanner ? (
          <LiveBanner
            title="Covenant breach detected"
            message={
              facilityPending.length > 0
                ? "A hold action is waiting for officer approval in the Approvals queue."
                : evidenceNeeded > 0
                  ? `DSCR breach confirmed. Collect ${evidenceNeeded} more evidence item(s), then run check again to propose a hold.`
                  : "PolicyGuard flagged this facility. Run a check to propose an escrow hold."
            }
            actionHref={
              facilityPending.length > 0 ? "/approvals" : undefined
            }
            actionLabel={
              facilityPending.length > 0 ? "Review approvals →" : undefined
            }
            onDismiss={() => setBannerDismissed(true)}
          />
        ) : null}

        {isDemoBreachFacility ? (
          <Card className="border-emerald-400/20 bg-emerald-400/[0.04]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live demo facility</CardTitle>
              <CardDescription>
                One check fetches x402 bank evidence (DSCR 0.82), detects breach,
                and proposes an escrow hold for CSPR.click approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => checkMutation.mutate()}
                disabled={checkMutation.isPending}
                className="gap-2"
              >
                {checkMutation.isPending ? "Running breach demo…" : "Run breach demo"}
              </Button>
              <span className="text-xs text-white/50">
                Evidence {evidence.length}/{MIN_EVIDENCE_FOR_HOLD} ·{" "}
                {facilityPending.length > 0
                  ? "hold pending approval"
                  : "ready for check"}
              </span>
            </CardContent>
          </Card>
        ) : null}

        <PageHeader
          eyebrow="Facility"
          title={facility.name}
          description={`Issuer ${facility.issuer.slice(0, 12)}… · Package on Casper testnet`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/facilities/${id}/audit`}>Audit trail</Link>
              </Button>
              {facilityPending.length > 0 ? (
                <Button asChild>
                  <Link href="/approvals">Approve hold →</Link>
                </Button>
              ) : (
                <Button
                  onClick={() => checkMutation.mutate()}
                  disabled={checkMutation.isPending}
                >
                  {checkMutation.isPending ? "Checking…" : "Check now"}
                </Button>
              )}
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {covenants.map((cov) => {
            const primaryBreach = facility.status === "breach" && cov.type === "DSCR";
            const warning = cov.confidence < 0.85;
            return (
              <Card key={cov.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{cov.type}</CardTitle>
                    <CovenantStatusBadge
                      status={
                        primaryBreach ? "BREACH" : warning ? "WARNING" : "OK"
                      }
                    />
                  </div>
                  <CardDescription>
                    Threshold {cov.threshold} · {cov.cadence}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-white/50">
                  <p className="line-clamp-3 italic text-white/60">
                    &ldquo;{cov.sourceQuote}&rdquo;
                  </p>
                  <Badge variant="outline">
                    confidence {(cov.confidence * 100).toFixed(0)}%
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Evidence timeline</h2>
              <Badge variant="outline" className="font-mono text-[10px]">
                {evidence.length}/{MIN_EVIDENCE_FOR_HOLD} for hold proposal
              </Badge>
            </div>
            {evidence.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-white/50">
                  No evidence recorded yet. Run a covenant check to fetch x402
                  data.
                </CardContent>
              </Card>
            ) : (
              evidence.map((item) => (
                <EvidenceCard key={item.id} evidence={item} />
              ))
            )}
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Escrow vault</CardTitle>
                <CardDescription>PolicyGuard-gated balances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-white/40">Total balance</div>
                  <div className="font-mono text-2xl text-white">
                    {formatMotes(escrow.balance)}{" "}
                    <span className="text-sm text-white/40">CSPR</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-white/40">Held</div>
                    <div
                      className={`font-mono ${Number(escrow.held) > 0 ? "text-red-300" : "text-white/80"}`}
                    >
                      {formatMotes(escrow.held)}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40">Released</div>
                    <div className="font-mono text-white/80">
                      {formatMotes(escrow.released)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-white/40">Reserve</div>
                    <div className="font-mono text-white/80">
                      {formatMotes(escrow.reserve)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {escrow.recentTxs.length === 0 ? (
                  <p className="text-xs text-white/40">No transactions yet.</p>
                ) : (
                  escrow.recentTxs.map((tx) => (
                    <div
                      key={tx.txHash}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <Badge variant="secondary">{tx.type}</Badge>
                      <TxLink hash={tx.txHash} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      <AgentActivityFeed events={events} connected={connected} />
    </>
  );
}
