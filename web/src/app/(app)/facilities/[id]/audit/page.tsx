"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { HashBlock } from "@/components/covenant/hash-block";
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
import { Label } from "@/components/ui/label";
import { getFacilityAudit } from "@/lib/api-client";
import { formatTimestamp } from "@/lib/format";

function ExportSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white"
    >
      <option value="all">All actors</option>
      <option value="covenant-agent">Covenant Agent</option>
      <option value="x402-gateway">x402 Gateway</option>
      <option value="treasury-agent">Treasury Agent</option>
    </select>
  );
}

export default function AuditTrailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [actorFilter, setActorFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => getFacilityAudit(id),
    enabled: Boolean(id),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `covenantos-audit-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Audit package exported"),
  });

  const entries = useMemo(() => {
    const list = data?.entries ?? [];
    if (actorFilter === "all") return list;
    return list.filter((e) => e.actor === actorFilter);
  }, [data?.entries, actorFilter]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Audit"
        title="Decision trail"
        description="Reconstruct every policy outcome from evidence hashes through approvals to on-chain execution, without exposing PII."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" asChild>
              <Link href={`/facilities/${id}`}>Back to facility</Link>
            </Button>
            <Button
              variant="outline"
              disabled={!data || exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              Export JSON
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="actor-filter">Filter by actor</Label>
        <ExportSelect value={actorFilter} onChange={setActorFilter} />
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-white/50">
            No audit entries for this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="relative space-y-8 border-l border-dashed border-white/15 pl-8">
          {entries.map((entry) => (
            <div key={entry.decisionId} className="relative">
              <span className="absolute -left-[2.35rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-black">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              </span>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                      {entry.decisionId}
                    </CardTitle>
                    {entry.actionType ? (
                      <Badge variant="outline">{entry.actionType}</Badge>
                    ) : null}
                    <Badge variant="secondary">{entry.actor}</Badge>
                  </div>
                  <CardDescription>
                    {formatTimestamp(entry.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {entry.reasoningSummary ? (
                    <p className="text-white/70">{entry.reasoningSummary}</p>
                  ) : null}
                  {entry.policyOutcome ? (
                    <div className="text-xs text-white/50">
                      Policy ·{" "}
                      <span className="text-white/80">
                        {entry.policyOutcome}
                      </span>
                    </div>
                  ) : null}
                  {entry.evidenceHashes.length > 0 ? (
                    <div className="space-y-2">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Evidence
                      </div>
                      {entry.evidenceHashes.map((hash) => (
                        <HashBlock key={hash} value={hash} />
                      ))}
                    </div>
                  ) : null}
                  {entry.executionTx ? (
                    <TxLink hash={entry.executionTx} label="execution" />
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
