import type { Evidence } from "@covenantos/shared";

import { HashBlock } from "@/components/covenant/hash-block";
import { TxLink } from "@/components/covenant/tx-link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelative } from "@/lib/format";

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const summary =
    evidence.rawPayload && typeof evidence.rawPayload === "object"
      ? JSON.stringify(evidence.rawPayload)
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{evidence.sourceId}</CardTitle>
          <Badge variant="secondary">x402 paid</Badge>
        </div>
        <CardDescription>{formatRelative(evidence.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
            Payload hash
          </div>
          <HashBlock value={evidence.payloadHash} />
        </div>
        {evidence.x402PaymentRef ? (
          <div className="text-xs text-white/50">
            Payment ref{" "}
            <span className="font-mono text-white/70">
              {evidence.x402PaymentRef}
            </span>
          </div>
        ) : null}
        {evidence.onchainReceiptTx ? (
          <TxLink hash={evidence.onchainReceiptTx} label="receipt" />
        ) : null}
        {summary ? (
          <p className="rounded-lg border border-white/5 bg-white/[0.02] p-3 font-mono text-[11px] text-white/60">
            {summary}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
