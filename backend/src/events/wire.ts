import { getAppStore } from "../store/persisting-store.js";
import type { ChainEvent } from "@covenantos/shared";
import { eventBus } from "./bus.js";
import { persistChainEvent } from "../db/index.js";
import { fromFacilityU64 } from "../chain/facility-id.js";
import { actionIdFromChainEvent } from "../chain/action-id-resolver.js";

export function wireChainStoreSync(): void {
  eventBus.subscribe((event: ChainEvent) => {
    if (event.payload?.source !== "chain" || !event.txHash) return;

    const store = getAppStore();

    if (event.type === "ActionProposed") {
      const onchainActionId = actionIdFromChainEvent(event);
      if (onchainActionId) {
        store.bindOnChainActionId(event.txHash, onchainActionId);
      }
      return;
    }

    if (event.type === "Held" || event.type === "Released") {
      const facilityId =
        (event.facilityId && fromFacilityU64(event.facilityId)) ??
        (typeof event.payload?.facility_id === "string"
          ? fromFacilityU64(event.payload.facility_id)
          : undefined);

      if (!facilityId) return;

      const amount =
        typeof event.payload?.amount === "string"
          ? event.payload.amount
          : event.payload?.amount != null
            ? String(event.payload.amount)
            : undefined;

      store.recordChainVaultExecution(facilityId, event.type, event.txHash, amount);
    }
  });
}

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
  getAppStore().subscribe((event) => {
    eventBus.publish({
      ...event,
      payload: { ...event.payload, source: "local" },
    });
  });
}
