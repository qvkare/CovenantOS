import type { ProposedAction } from "@covenantos/shared";
import { getDemoStore } from "@covenantos/shared";
import { defaultAgentPolicy } from "../../policy/runtime-policy.js";
import { ChainWriter } from "../../chain/writer.js";

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
    const store = getDemoStore();
    const action = store.getAction(actionId);
    if (!action) return null;

    this.validateExecution(action);

    const chainTx = await this.chainWriter.executeVaultAction(
      action.type,
      action.facilityId,
      action.onchainActionId ?? action.paramsHash ?? actionId,
    );

    const executionTx =
      chainTx ??
      `deploy-exec-${actionId.slice(-6)}abcdef1234567890abcdef1234567890ab`;

    const executed = store.executeAction(actionId, executionTx);
    if (!executed) return null;

    return { action: executed, executionTx, chainTx };
  }
}
