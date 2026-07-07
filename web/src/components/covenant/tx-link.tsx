import { ExternalLink } from "lucide-react";

import { explorerTx } from "@/lib/casper/explorer";
import { truncateHash } from "@/lib/format";

export function TxLink({
  hash,
  label = "tx",
}: {
  hash: string;
  label?: string;
}) {
  return (
    <a
      href={explorerTx(hash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/50 transition-colors hover:text-white"
    >
      {label} {truncateHash(hash, 8, 6)}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}
