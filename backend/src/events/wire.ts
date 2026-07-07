import { getDemoStore } from "@covenantos/shared";
import type { ChainEvent } from "@covenantos/shared";
import { eventBus } from "./bus.js";
import { persistChainEvent } from "../db/index.js";

export function wireEventPersistence(): void {
  eventBus.subscribe((event: ChainEvent) => {
    const source =
      typeof event.payload?.source === "string" ? event.payload.source : "local";

    void persistChainEvent({
      ...event,
      source,
      contractHash:
        typeof event.payload?.contractHash === "string"
          ? event.payload.contractHash
          : undefined,
    }).catch(() => {
      // Postgres may be unavailable in dev; SSE still works via EventBus.
    });
  });
}

export function wireDemoStoreEvents(): void {
  getDemoStore().subscribe((event) => {
    eventBus.publish({
      ...event,
      payload: { ...event.payload, source: "local" },
    });
  });
}
