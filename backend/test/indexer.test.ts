import { describe, expect, it } from "vitest";
import { parseCsprCloudMessage } from "../src/indexer/parser.js";
import { normalizeContractHash } from "../src/indexer/config.js";

describe("indexer parser", () => {
  const packageHash = normalizeContractHash(
    "hash-1c8d95efb3ee992910193a1cfbb5d168d13b1d92603a77f69c6555c9ab8fffa2",
  );
  const allowed = new Set([packageHash]);

  it("maps CSPR.cloud contract events to ChainEvent", () => {
    const event = parseCsprCloudMessage(
      {
        action: "emitted",
        timestamp: "2026-07-07T12:00:00.000Z",
        data: {
          contract_package_hash: packageHash,
          contract_hash: "abc123",
          name: "ActionProposed",
          data: {
            action_id: 7,
            facility_id: 1,
            action_type: 1,
          },
        },
        extra: {
          deploy_hash: "deploy-hash-001",
          block_height: 8429000,
          event_id: 0,
        },
      },
      allowed,
    );

    expect(event?.type).toBe("ActionProposed");
    expect(event?.facilityId).toBe("1");
    expect(event?.txHash).toBe("deploy-hash-001");
    expect(event?.blockHeight).toBe(8429000);
    expect(event?.payload.source).toBe("chain");
  });

  it("ignores events from unrelated package hashes", () => {
    const event = parseCsprCloudMessage(
      {
        action: "emitted",
        data: {
          contract_package_hash: "deadbeef",
          name: "Held",
          data: {},
        },
      },
      allowed,
    );

    expect(event).toBeNull();
  });

  it("ignores unknown event names", () => {
    const event = parseCsprCloudMessage(
      {
        action: "emitted",
        data: {
          contract_package_hash: packageHash,
          name: "UnknownEvent",
          data: {},
        },
      },
      allowed,
    );

    expect(event).toBeNull();
  });
});

describe("event bus", () => {
  it("delivers published events to subscribers", async () => {
    const { eventBus } = await import("../src/events/bus.js");
    const received: string[] = [];

    const unsubscribe = eventBus.subscribe((event) => {
      received.push(event.id);
    });

    eventBus.publish({
      id: "evt-test-1",
      type: "EvidenceRecorded",
      payload: {},
      createdAt: new Date().toISOString(),
    });

    unsubscribe();
    expect(received).toEqual(["evt-test-1"]);
  });
});
