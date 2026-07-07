import { describe, expect, it } from "vitest";
import { loadTestnetConfig } from "../src/chain/config.js";
import { ContractRegistry } from "../src/chain/contracts.js";

describe("chain config", () => {
  it("loads shared testnet config", () => {
    const config = loadTestnetConfig();
    expect(config.networkName).toBe("casper-test");
    expect(config.contracts.policyGuard).toBeDefined();
  });

  it("reports deployed contracts on testnet config", () => {
    const registry = ContractRegistry.load();
    expect(registry.allDeployed()).toBe(true);
    expect(registry.address("policyGuard")).toMatch(/^hash-/);
  });
});
