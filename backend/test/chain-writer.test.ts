import { describe, expect, it } from "vitest";
import { DEMO_FACILITY_IDS } from "@covenantos/shared";
import { ContractRegistry } from "../src/chain/contracts.js";
import { toFacilityU64 } from "../src/chain/facility-id.js";
import { ChainWriter } from "../src/chain/writer.js";

describe("facility-id mapping", () => {
  it("maps demo facilities to stable on-chain ids", () => {
    expect(toFacilityU64(DEMO_FACILITY_IDS.healthy)).toBe(1n);
    expect(toFacilityU64(DEMO_FACILITY_IDS.breach)).toBe(2n);
  });

  it("maps dynamic facilities deterministically", () => {
    const a = toFacilityU64("fac-dynamic-abc");
    const b = toFacilityU64("fac-dynamic-abc");
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(100n);
  });
});

describe("ChainWriter stub mode", () => {
  it("returns mock hashes when on-chain writer is unavailable", async () => {
    const registry = {
      allDeployed: () => false,
      isDeployed: () => false,
      snapshot: () => ContractRegistry.load().snapshot(),
    } as unknown as ContractRegistry;

    const writer = new ChainWriter(registry);
    expect(writer.canWriteOnChain()).toBe(false);

    const evidence = await writer.recordEvidence({
      facilityId: DEMO_FACILITY_IDS.breach,
      payloadHash: "hash-abc",
      sourceId: "bank-statement",
      x402PaymentRef: "pay-1",
    });
    expect(evidence).toBeUndefined();

    const registryDeployed = {
      allDeployed: () => true,
      isDeployed: (name: string) =>
        name === "evidenceReceipt" || name === "policyGuard" || name === "facilityVault",
      snapshot: () => ContractRegistry.load().snapshot(),
    } as unknown as ContractRegistry;

    const stubWriter = new ChainWriter(registryDeployed, null);
    const mockEvidence = await stubWriter.recordEvidence({
      facilityId: DEMO_FACILITY_IDS.breach,
      payloadHash: "hash-abc",
      sourceId: "bank-statement",
      x402PaymentRef: "pay-1",
    });
    expect(mockEvidence).toMatch(/^deploy-evidence-/);

    const propose = await stubWriter.proposeAction({
      facilityId: DEMO_FACILITY_IDS.breach,
      actionType: "hold",
      paramsHash: "params-1",
    });
    expect(propose?.txHash).toMatch(/^deploy-propose-/);

    const vault = await stubWriter.executeVaultAction({
      actionType: "hold",
      facilityId: DEMO_FACILITY_IDS.breach,
      onchainActionId: "1",
    });
    expect(vault).toMatch(/^deploy-vault-/);
  });
});
