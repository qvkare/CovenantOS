import { createHash } from "node:crypto";
import type { ActionType } from "@covenantos/shared";
import { Args, CLValue, PublicKey, Key, type CasperArgs } from "./casper-sdk.js";
import { waitForOnChainActionId } from "./action-id-resolver.js";
import { ContractRegistry } from "./contracts.js";
import { ACTION_TYPE_ONCHAIN, toFacilityU64 } from "./facility-id.js";
import { ChainTxSubmitter, parseProposedActionId } from "./tx.js";

export type ProposeActionInput = {
  facilityId: string;
  actionType: ActionType;
  paramsHash: string;
};

export type RecordEvidenceInput = {
  facilityId: string;
  payloadHash: string;
  sourceId: string;
  x402PaymentRef: string;
  timestamp?: number;
};

export type VaultActionInput = {
  actionType: ActionType;
  facilityId: string;
  onchainActionId: string;
  amountMotes?: string;
  recipientPublicKeyHex?: string;
};

export type ProposeActionResult = {
  txHash: string;
  actionId?: string;
};

const HOLD_AMOUNT_MOTES = "1200000000000";

export class ChainWriter {
  private readonly registry: ContractRegistry;
  private readonly submitter?: ChainTxSubmitter;

  constructor(registry?: ContractRegistry, submitter?: ChainTxSubmitter | null) {
    this.registry = registry ?? ContractRegistry.load();
    this.submitter =
      submitter === null ? undefined : (submitter ?? ChainTxSubmitter.tryCreate(this.registry));
  }

  isReady(): boolean {
    return this.registry.allDeployed();
  }

  canWriteOnChain(): boolean {
    return Boolean(this.submitter);
  }

  async recordEvidence(input: RecordEvidenceInput): Promise<string | undefined> {
    if (!this.registry.isDeployed("evidenceReceipt")) {
      return undefined;
    }

    if (!this.submitter) {
      return this.mockTx("evidence", input.payloadHash, input.facilityId);
    }

    const args = Args.fromMap({
      facility_id: CLValue.newCLUint64(toFacilityU64(input.facilityId)),
      evidence_hash: CLValue.newCLString(input.payloadHash),
      source_id: CLValue.newCLString(input.sourceId),
      x402_payment_ref: CLValue.newCLString(input.x402PaymentRef),
      timestamp: CLValue.newCLUint64(input.timestamp ?? Math.floor(Date.now() / 1000)),
    });

    const { txHash } = await this.submitter.submit({
      contract: "evidenceReceipt",
      entryPoint: "record_evidence",
      args,
    });

    return txHash;
  }

  async proposeAction(input: ProposeActionInput): Promise<ProposeActionResult | undefined> {
    if (!this.registry.isDeployed("policyGuard")) {
      return undefined;
    }

    const onchainType = ACTION_TYPE_ONCHAIN[input.actionType as keyof typeof ACTION_TYPE_ONCHAIN];
    if (onchainType === undefined) {
      return undefined;
    }

    if (!this.submitter) {
      const digest = createHash("sha256")
        .update(`${input.facilityId}:${input.actionType}:${input.paramsHash}`)
        .digest("hex")
        .slice(0, 16);
      return { txHash: this.mockTx("propose", digest, input.facilityId) };
    }

    const args = Args.fromMap({
      facility_id: CLValue.newCLUint64(toFacilityU64(input.facilityId)),
      action_type: CLValue.newCLUint8(onchainType),
      params_hash: CLValue.newCLString(input.paramsHash),
    });

    const { txHash, result } = await this.submitter.submit({
      contract: "policyGuard",
      entryPoint: "propose_action",
      args,
    });

    return {
      txHash,
      actionId: parseProposedActionId(result),
    };
  }

  /** Resolve numeric PolicyGuard action id from indexer if execution effects missed it. */
  async resolveOnChainActionId(input: {
    proposeTxHash: string;
    paramsHash?: string;
    knownActionId?: string;
  }): Promise<string | undefined> {
    if (input.knownActionId && /^\d+$/.test(input.knownActionId)) {
      return input.knownActionId;
    }

    return waitForOnChainActionId({
      proposeTxHash: input.proposeTxHash,
      paramsHash: input.paramsHash,
      timeoutMs: 12_000,
    });
  }

  async ensurePolicyGuardSignerWeight(weight: number): Promise<string | undefined> {
    if (!this.registry.isDeployed("policyGuard") || !this.submitter) {
      return undefined;
    }

    const publicKey = this.submitter.signerPublicKey;
    const signerKey = Key.newKey(publicKey.accountHash().toPrefixedString());
    const args = Args.fromMap({
      signer: CLValue.newCLKey(signerKey),
      weight: CLValue.newCLUint8(weight),
    });

    const { txHash } = await this.submitter.submit({
      contract: "policyGuard",
      entryPoint: "set_signer_weight",
      args,
    });

    return txHash;
  }

  async seedDemoVaultBalance(facilityId: string, amountMotes: string): Promise<string | undefined> {
    if (!this.registry.isDeployed("facilityVault") || !this.submitter) {
      return undefined;
    }

    const args = Args.fromMap({
      facility_id: CLValue.newCLUint64(toFacilityU64(facilityId)),
      amount: CLValue.newCLUInt512(amountMotes),
    });

    const { txHash } = await this.submitter.submit({
      contract: "facilityVault",
      entryPoint: "demo_seed_balance",
      args,
    });

    return txHash;
  }

  async approveAction(onchainActionId: string): Promise<string | undefined> {
    if (!this.registry.isDeployed("policyGuard")) {
      return undefined;
    }

    if (!this.submitter) {
      return this.mockTx("approve", onchainActionId, "action");
    }

    const args = Args.fromMap({
      action_id: CLValue.newCLUint64(BigInt(onchainActionId)),
    });

    const { txHash } = await this.submitter.submit({
      contract: "policyGuard",
      entryPoint: "approve_action",
      args,
    });

    return txHash;
  }

  async registerCovenant(input: {
    facilityId: string;
    covenantId: string;
    registryHash: string;
  }): Promise<string | undefined> {
    if (!this.registry.isDeployed("evidenceReceipt")) {
      return undefined;
    }

    if (!this.submitter) {
      return this.mockTx("covenant", input.registryHash, input.covenantId);
    }

    const args = Args.fromMap({
      facility_id: CLValue.newCLUint64(toFacilityU64(input.facilityId)),
      evidence_hash: CLValue.newCLString(input.registryHash),
      source_id: CLValue.newCLString(`covenant:${input.covenantId}`),
      x402_payment_ref: CLValue.newCLString(""),
      timestamp: CLValue.newCLUint64(Math.floor(Date.now() / 1000)),
    });

    const { txHash } = await this.submitter.submit({
      contract: "evidenceReceipt",
      entryPoint: "record_evidence",
      args,
    });

    return txHash;
  }

  async executeVaultAction(input: VaultActionInput): Promise<string | undefined> {
    if (!this.registry.isDeployed("facilityVault")) {
      return undefined;
    }

    if (!this.submitter) {
      return this.mockTx("vault", input.actionType, input.facilityId);
    }

    if (!/^\d+$/.test(input.onchainActionId)) {
      throw new Error(
        "On-chain PolicyGuard action id is required for vault execution (wait for ActionProposed indexing)",
      );
    }

    const facilityU64 = toFacilityU64(input.facilityId);
    const actionId = BigInt(input.onchainActionId);
    const amount = input.amountMotes ?? HOLD_AMOUNT_MOTES;

    let entryPoint: string;
    let args: CasperArgs;

    switch (input.actionType) {
      case "hold":
        entryPoint = "hold";
        args = Args.fromMap({
          facility_id: CLValue.newCLUint64(facilityU64),
          amount: CLValue.newCLUInt512(amount),
          action_id: CLValue.newCLUint64(actionId),
        });
        break;
      case "release": {
        const recipientHex = input.recipientPublicKeyHex;
        if (!recipientHex) {
          throw new Error("Release requires recipientPublicKeyHex");
        }
        entryPoint = "release";
        args = Args.fromMap({
          facility_id: CLValue.newCLUint64(facilityU64),
          recipient: CLValue.newCLPublicKey(PublicKey.fromHex(recipientHex)),
          amount: CLValue.newCLUInt512(amount),
          action_id: CLValue.newCLUint64(actionId),
        });
        break;
      }
      case "top_up":
        entryPoint = "top_up_reserve";
        args = Args.fromMap({
          facility_id: CLValue.newCLUint64(facilityU64),
          amount: CLValue.newCLUInt512(amount),
          action_id: CLValue.newCLUint64(actionId),
        });
        break;
      default:
        return undefined;
    }

    const { txHash } = await this.submitter.submit({
      contract: "facilityVault",
      entryPoint,
      args,
    });

    return txHash;
  }

  private mockTx(kind: string, seed: string, suffix: string): string {
    const digest = createHash("sha256")
      .update(`${kind}:${seed}:${suffix}`)
      .digest("hex")
      .slice(0, 16);
    return `deploy-${kind}-${digest}abcdef1234567890abcdef1234567890ab`;
  }
}
