"use client";

import type { ChainEvent, ChainEventType } from "@covenantos/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { apiBaseUrl } from "@/lib/api";
import { subscribeMockEvents } from "@/mocks/handlers";

const INVALIDATE_MAP: Partial<Record<ChainEventType, string[]>> = {
  BreachDetected: ["facilities", "facility"],
  ActionProposed: ["actions"],
  ActionExecutable: ["actions", "facility"],
  EvidenceRecorded: ["facility"],
};

export function useLiveEvents() {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const handleEvent = useCallback(
    (raw: unknown) => {
      const event = raw as ChainEvent;
      if (!event?.type) return;
      setEvents((prev) => [
        ...prev,
        {
          ...event,
          id: event.id ?? `evt-${Date.now()}`,
          createdAt: event.createdAt ?? new Date().toISOString(),
          payload: event.payload ?? {},
        },
      ]);
      const keys = INVALIDATE_MAP[event.type as ChainEventType];
      if (keys) {
        for (const key of keys) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MSW === "true") {
      setConnected(true);
      return subscribeMockEvents(handleEvent);
    }

    const es = new EventSource(`${apiBaseUrl}/events/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        handleEvent(JSON.parse(ev.data));
      } catch {
        // ignore malformed frames
      }
    };
    return () => es.close();
  }, [handleEvent]);

  return { events, connected };
}
