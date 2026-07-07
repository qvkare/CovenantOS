import type { ProposedAction } from "@covenantos/shared";
import { getAppStore } from "../../store/persisting-store.js";
import { defaultAgentPolicy } from "../../policy/runtime-policy.js";
import { ChainWriter } from "../../chain/writer.js";
import { tryLoadSigner } from "../../chain/tx.js";

export type TreasuryExecutionResult = {
  action: ProposedAction;
  executionTx: string;
  chainTx?: string;
};

export class TreasuryAgent {
  constructor(private readonly chainWriter: ChainWriter = new ChainWriter()) {}

  validateExecution(action: ProposedAction): void {
    if (action.status !== "executable") {
      throw new Error(`Action ${action.id} is not executable (status: ${action.status})`);
    }

    if (action.evidenceIds.length === 0 && action.type === "hold") {
      throw new Error("Hold actions require linked evidence (evidence-before-action)");
    }

    if (action.type === "top_up") {
      const topUpMotes = 1_000_000_000n;
      if (topUpMotes > defaultAgentPolicy.maxSpendMotes) {
        throw new Error("Top-up amount exceeds treasury spend limit");
      }
    }
  }

  async execute(actionId: string): Promise<TreasuryExecutionResult | null> {
    const store = getAppStore();
    const action = store.getAction(actionId);
    if (!action) return null;

    this.validateExecution(action);

    let onchainActionId = action.onchainActionId;
    if ((!onchainActionId || !/^\d+$/.test(onchainActionId)) && action.proposeTxHash) {
      onchainActionId = await this.chainWriter.resolveOnChainActionId({
        proposeTxHash: action.proposeTxHash,
        paramsHash: action.paramsHash,
        knownActionId: action.onchainActionId,
      });
      if (onchainActionId) {
        store.setActionChainIds(actionId, { onchainActionId });
      }
    }

    if (this.chainWriter.canWriteOnChain() && (!onchainActionId || !/^\d+$/.test(onchainActionId))) {
      throw new Error("On-chain action id is not available yet — wait a few seconds and retry");
    }

    const facility = store.getFacility(action.facilityId);

    const chainTx = onchainActionId
      ? await this.chainWriter.executeVaultAction({
          actionType: action.type,
          facilityId: action.facilityId,
          onchainActionId,
          recipientPublicKeyHex:
            action.type === "release"
              ? (tryLoadSigner()?.publicKey.toHex() ?? facility?.facility.issuer)
              : undefined,
        })
      : undefined;

    const executionTx =
      chainTx ??
      `deploy-exec-${actionId.slice(-6)}abcdef1234567890abcdef1234567890ab`;

    const executed = store.executeAction(actionId, executionTx);
    if (!executed) return null;

    return { action: executed, executionTx, chainTx };
  }
}
