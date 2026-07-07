import { ExternalLink } from "lucide-react";

import { explorerTx, isExplorerTxHash } from "@/lib/casper/explorer";
import { truncateHash } from "@/lib/format";

export function TxLink({
  hash,
  label = "tx",
}: {
  hash: string;
  label?: string;
}) {
  const display = `${label} ${truncateHash(hash, 8, 6)}`;

  if (!isExplorerTxHash(hash)) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/35">
        {display}
      </span>
    );
  }

  return (
    <a
      href={explorerTx(hash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/50 transition-colors hover:text-white"
    >
      {display}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}
