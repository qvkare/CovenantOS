import { describe, expect, it } from "vitest";
import {
  DEMO_FACILITY_IDS,
  evaluateCovenants,
  resetDemoStore,
} from "@covenantos/shared";
import { CovenantAgent } from "../src/agents/covenant-agent.js";
import { TreasuryAgent } from "../src/agents/treasury-agent.js";

describe("evaluateCovenants", () => {
  it("flags DSCR breach below threshold", () => {
    const result = evaluateCovenants(
      [
        {
          id: "cov-1",
          facilityId: "fac-1",
          type: "DSCR",
          threshold: 1.2,
          cadence: "monthly",
          sourceQuote: "Min DSCR 1.2",
          confidence: 0.9,
          humanVerified: true,
          createdAt: "",
          updatedAt: "",
        },
      ],
      { dscr: 0.82 },
    );

    expect(result.status).toBe("breach");
    expect(result.breaches[0]?.type).toBe("DSCR");
  });

  it("passes healthy DSCR", () => {
    const result = evaluateCovenants(
      [
        {
          id: "cov-1",
          facilityId: "fac-1",
          type: "DSCR",
          threshold: 1.2,
          cadence: "monthly",
          sourceQuote: "Min DSCR 1.2",
          confidence: 0.9,
          humanVerified: true,
          createdAt: "",
          updatedAt: "",
        },
      ],
      { dscr: 1.45 },
    );

    expect(result.status).toBe("ok");
  });
});

describe("CovenantAgent", () => {
  it("records evidence and proposes hold on breach after two evidence items", async () => {
    resetDemoStore();
    const agent = new CovenantAgent({
      recordEvidence: async () => "mock-receipt-tx",
      proposeAction: async () => ({ txHash: "mock-propose-tx", actionId: "42" }),
      executeVaultAction: async () => undefined,
      isReady: () => true,
      canWriteOnChain: () => false,
    } as never);

    const payload = {
      sourceId: "bank-statement",
      payloadHash: "abc123",
      payload: { dscr: 0.82, cashBalance: 120000, scenario: "breach" },
    };

    const first = await agent.processEvidence({
      facilityId: DEMO_FACILITY_IDS.breach,
      data: { ...payload, payloadHash: "abc123-1" },
      paymentRef: "pay-1",
    });
    expect(first?.status).toBe("breach");
    if (first?.status === "breach") {
      expect(first.action).toBeUndefined();
    }

    const result = await agent.processEvidence({
      facilityId: DEMO_FACILITY_IDS.breach,
      data: { ...payload, payloadHash: "abc123-2" },
      paymentRef: "pay-2",
    });

    expect(result?.status).toBe("breach");
    if (result?.status === "breach") {
      expect(result.action?.type).toBe("hold");
      expect(result.action?.evidenceIds.length).toBeGreaterThan(0);
    }
  });

  it("returns no_evidence when facility has none", () => {
    resetDemoStore();
    const agent = new CovenantAgent();
    const result = agent.runCheck(DEMO_FACILITY_IDS.breach);
    expect(result?.status).toBe("no_evidence");
  });
});

describe("TreasuryAgent", () => {
  it("executes hold after approvals reach threshold", async () => {
    resetDemoStore();
    const covenant = new CovenantAgent({
      recordEvidence: async () => "mock-receipt-tx",
      proposeAction: async () => ({ txHash: "mock-propose-tx", actionId: "42" }),
      executeVaultAction: async () => "vault-tx",
      isReady: () => true,
      canWriteOnChain: () => false,
    } as never);

    await covenant.processEvidence({
      facilityId: DEMO_FACILITY_IDS.breach,
      data: {
        sourceId: "bank-statement",
        payloadHash: "breach-hash-1",
        payload: { dscr: 0.82 },
      },
    });
    await covenant.processEvidence({
      facilityId: DEMO_FACILITY_IDS.breach,
      data: {
        sourceId: "bank-statement",
        payloadHash: "breach-hash-2",
        payload: { dscr: 0.81 },
      },
    });

    const store = (await import("@covenantos/shared")).getDemoStore();
    const hold = store.listActions("pending").find((a) => a.type === "hold");
    expect(hold).toBeDefined();

    const approved = store.approveAction(hold!.id, { approver: "officer-1" });
    expect(approved?.status).toBe("executable");

    const treasury = new TreasuryAgent({
      executeVaultAction: async () => "vault-tx-hash",
      isReady: () => true,
      canWriteOnChain: () => false,
    } as never);

    const execution = await treasury.execute(hold!.id);
    expect(execution?.action.status).toBe("executed");
    expect(execution?.chainTx).toBe("vault-tx-hash");
  });
});
