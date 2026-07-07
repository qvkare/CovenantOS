"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AgentActivityFeed } from "@/components/covenant/agent-activity-feed";
import { EmptyState } from "@/components/covenant/empty-state";
import { FacilityRow } from "@/components/covenant/facility-row";
import { PageHeader } from "@/components/covenant/page-header";
import { Button } from "@/components/ui/button";
import { useLiveEvents } from "@/hooks/use-live-events";
import { listFacilities } from "@/lib/api-client";

export default function DashboardPage() {
  const { events, connected } = useLiveEvents();
  const { data, isLoading, error } = useQuery({
    queryKey: ["facilities"],
    queryFn: listFacilities,
  });

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Protocol · Dashboard"
          title="Facility portfolio"
          description="Live covenant status across tokenized credit facilities. Breach events stream from the indexer in under five seconds."
          action={
            <Button asChild>
              <Link href="/facilities/new">New facility</Link>
            </Button>
          }
        />

        {error ? (
          <EmptyState
            title="Unable to load facilities"
            description={(error as Error).message}
          />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : !data?.facilities.length ? (
          <EmptyState
            title="No facilities yet"
            description="Upload a finance facility document to extract covenants and register on Casper testnet."
            action={
              <Button asChild>
                <Link href="/facilities/new">Create your first facility</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {data.facilities.map((facility) => (
              <FacilityRow key={facility.id} facility={facility} />
            ))}
          </div>
        )}
      </div>
      <AgentActivityFeed events={events} connected={connected} />
    </>
  );
}
