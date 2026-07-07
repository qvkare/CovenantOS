"use client";

import { DEMO_FACILITY_IDS } from "@covenantos/shared";
import Link from "next/link";

import { CovenantStatusBadge } from "@/components/covenant/covenant-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FacilitySummary } from "@/lib/api-client";
import { formatMotes, formatRelative, truncateAddress } from "@/lib/format";

export function FacilityRow({ facility }: { facility: FacilitySummary }) {
  const statusForBadge =
    facility.status === "breach"
      ? "BREACH"
      : facility.covenantWarning > 0
        ? "WARNING"
        : "OK";

  return (
    <Link href={`/facilities/${facility.id}`} className="group block">
      <Card className="transition-colors group-hover:border-white/20 group-hover:bg-white/[0.07]">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{facility.name}</CardTitle>
              {facility.id === DEMO_FACILITY_IDS.breach ? (
                <Badge className="bg-emerald-500/20 text-emerald-200">Live demo</Badge>
              ) : null}
              <CovenantStatusBadge status={statusForBadge} />
              <Badge variant="outline">{facility.status}</Badge>
            </div>
            <CardDescription>
              Issuer{" "}
              <span className="font-mono text-white/60">
                {truncateAddress(facility.issuer, 6)}
              </span>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg text-white">
              {formatMotes(facility.escrowBalanceCache)}{" "}
              <span className="text-xs text-white/40">CSPR escrow</span>
            </div>
            {facility.lastCheckedAt ? (
              <div className="text-xs text-white/40">
                Checked {formatRelative(facility.lastCheckedAt)}
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 pt-0 text-xs text-white/50">
          <span>
            <span className="text-green-300">{facility.covenantOk} OK</span>
            {facility.covenantWarning > 0 ? (
              <>
                {" · "}
                <span className="text-yellow-300">
                  {facility.covenantWarning} warning
                </span>
              </>
            ) : null}
            {facility.covenantBreach > 0 ? (
              <>
                {" · "}
                <span className="text-red-300">
                  {facility.covenantBreach} breach
                </span>
              </>
            ) : null}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
