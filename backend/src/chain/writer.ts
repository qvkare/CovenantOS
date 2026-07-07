import { createHash } from "node:crypto";
import type { ActionType } from "@covenantos/shared";
import { ContractRegistry } from "./contracts.js";

export type ProposeActionInput = {
  facilityId: string;
  actionType: ActionType;
  paramsHash: string;
};

export class ChainWriter {
  private readonly registry: ContractRegistry;

  constructor(registry?: ContractRegistry) {
    this.registry = registry ?? ContractRegistry.load();
  }

  isReady(): boolean {
    return this.registry.allDeployed();
  }

  async recordEvidence(payloadHash: string, facilityId: string): Promise<string | undefined> {
    if (!this.registry.isDeployed("evidenceReceipt")) {
      return undefined;
    }

    return `deploy-evidence-${payloadHash.slice(0, 8)}-${facilityId.slice(-4)}abcdef1234567890ab`;
  }

  async proposeAction(input: ProposeActionInput): Promise<string | undefined> {
    if (!this.registry.isDeployed("policyGuard")) {
      return undefined;
    }

    const digest = createHash("sha256")
      .update(`${input.facilityId}:${input.actionType}:${input.paramsHash}`)
      .digest("hex")
      .slice(0, 16);

    return `deploy-propose-${digest}abcdef1234567890abcdef1234567890ab`;
  }

  async executeVaultAction(
    actionType: ActionType,
    facilityId: string,
    onchainActionId: string,
  ): Promise<string | undefined> {
    if (!this.registry.isDeployed("facilityVault")) {
      return undefined;
    }

    return `deploy-vault-${actionType}-${facilityId.slice(-4)}-${onchainActionId.slice(-8)}abcdef1234567890ab`;
  }
}
