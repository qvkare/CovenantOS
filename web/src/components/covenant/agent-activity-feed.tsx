"use client";

import type { ChainEvent } from "@covenantos/shared";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AgentActivityFeed({
  events,
  connected,
  className,
}: {
  events: ChainEvent[];
  connected: boolean;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <Card
      className={cn(
        "fixed bottom-4 right-4 z-30 w-[min(100vw-2rem,360px)] shadow-2xl",
        className,
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">Live events</CardTitle>
        <Badge variant={connected ? "success" : "warning"}>
          {connected ? "Live" : "Offline"}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={listRef}
          className="max-h-64 space-y-2 overflow-y-auto border-t border-white/5 px-4 py-3"
        >
          {events.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/40">
              Waiting for chain events…
            </p>
          ) : (
            events
              .slice(-20)
              .reverse()
              .map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-white/80">
                      {event.type}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {formatRelative(event.createdAt)}
                    </span>
                  </div>
                  {event.facilityId ? (
                    <div className="mt-1 font-mono text-[10px] text-white/40">
                      {event.facilityId}
                    </div>
                  ) : null}
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
