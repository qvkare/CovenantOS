"use client";

import { Copy, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truncateAddress } from "@/lib/format";
import { explorerAccount } from "@/lib/casper/explorer";
import { useClickWallet } from "@/lib/casper/click-context";
import { cn } from "@/lib/utils";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { ready, signedIn, publicKey, provider, signIn, signOut } =
    useClickWallet();

  if (!ready) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading…
      </Button>
    );
  }

  if (!signedIn || !publicKey) {
    return (
      <Button
        variant="default"
        size={compact ? "sm" : "default"}
        onClick={() => void signIn()}
      >
        Connect wallet
      </Button>
    );
  }

  async function copyAddress() {
    await navigator.clipboard.writeText(publicKey!);
    toast.success("Address copied");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2 pr-3">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
          <span className="font-mono text-xs">
            {truncateAddress(publicKey, 4)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>CSPR.click</DropdownMenuLabel>
        <div className="px-2.5 pb-2 text-xs text-white/70">
          {provider ? (
            <div className="capitalize">{provider.replace(/-/g, " ")}</div>
          ) : null}
          <div className="mt-1 font-mono text-[11px] text-white/50">
            {truncateAddress(publicKey, 8)}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void copyAddress()}>
          <Copy className="h-3.5 w-3.5 opacity-70" />
          Copy address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={explorerAccount(publicKey)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            View on CSPR.live
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className={cn("text-red-300 focus:text-red-200")}
        >
          <LogOut className="h-3.5 w-3.5" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
