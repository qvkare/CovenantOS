import type { EvidenceProviderResponse, ProposedAction } from "@covenantos/shared";
import {
  bankPayloadFromEvidence,
  evaluateCovenants,
  type CovenantCheckResult,
  type CovenantEvaluation,
} from "@covenantos/shared";
import { getAppStore } from "../../store/persisting-store.js";
import type { ChainWriter } from "../../chain/writer.js";
import { ChainWriter as DefaultChainWriter } from "../../chain/writer.js";
import { validateEvidencePayload } from "../../security/evidence-guard.js";
import type { EvidenceFetchResult } from "../../x402/gateway.js";

/** Require at least two independent evidence items before proposing hold. */
export const MIN_EVIDENCE_FOR_PROPOSE = 2;

export type ProcessEvidenceInput = {
  facilityId: string;
  data: EvidenceProviderResponse;
  paymentRef?: string;
  onchainReceiptTx?: string;
};

export class CovenantAgent {
  constructor(private readonly chainWriter: ChainWriter = new DefaultChainWriter()) {}

  async processEvidence(input: ProcessEvidenceInput): Promise<CovenantCheckResult | null> {
    const store = getAppStore();
    const facility = store.getFacility(input.facilityId);
    if (!facility) return null;

    const rawPayload = input.data.payload;

    const guard = validateEvidencePayload(rawPayload);
    if (!guard.ok) {
      return {
        status: "ok",
        evaluation: { status: "ok", breaches: [] } satisfies CovenantEvaluation,
      };
    }

    const receiptTx =
      input.onchainReceiptTx ??
      (await this.chainWriter.recordEvidence({
        facilityId: input.facilityId,
        payloadHash: input.data.payloadHash,
        sourceId: input.data.sourceId,
        x402PaymentRef: input.paymentRef ?? "",
      }));

    const evidence = store.recordEvidence(input.facilityId, {
      sourceId: input.data.sourceId,
      payloadHash: input.data.payloadHash,
      rawPayload,
      x402PaymentRef: input.paymentRef,
      onchainReceiptTx: receiptTx,
    });

    if (!evidence) return null;

    const covenants = store.getCovenants(input.facilityId);
    const evaluation = evaluateCovenants(covenants, bankPayloadFromEvidence(rawPayload));

    if (
      evaluation.status === "breach" &&
      (store.getFacility(input.facilityId)?.evidence.length ?? 0) < MIN_EVIDENCE_FOR_PROPOSE
    ) {
      return { status: evaluation.status, evaluation };
    }

    const result = store.applyCovenantEvaluation(input.facilityId, evaluation, evidence);

    if (result.status === "breach" && result.action) {
      await this.proposeOnChain(input.facilityId, "hold", result.action);
    }

    if (result.status === "release_pending" && result.action) {
      await this.proposeOnChain(input.facilityId, "release", result.action);
    }

    return result;
  }

  /**
   * Submit the PolicyGuard proposal on-chain and persist the resulting tx hash.
   * On-chain hiccups must never fail the covenant check — the breach and the
   * proposed action are already recorded off-chain.
   */
  private async proposeOnChain(
    facilityId: string,
    actionType: "hold" | "release",
    action: ProposedAction,
  ): Promise<void> {
    try {
      const propose = await this.chainWriter.proposeAction({
        facilityId,
        actionType,
        paramsHash: action.paramsHash ?? action.id,
      });
      if (propose) {
        getAppStore().setActionChainIds(action.id, {
          proposeTxHash: propose.txHash,
          onchainActionId: propose.actionId,
        });
      }
    } catch (error) {
      console.warn(`propose_action on-chain failed for ${action.id}`, error);
    }
  }

  async ingestFetchResult(
    facilityId: string,
    fetchResult: EvidenceFetchResult,
  ): Promise<CovenantCheckResult | null> {
    const store = getAppStore();
    void store.persistX402Payment({
      ...fetchResult.payment,
      facilityId,
      createdAt: fetchResult.payment.createdAt ?? new Date().toISOString(),
    });

    return this.processEvidence({
      facilityId,
      data: fetchResult.data,
      paymentRef: fetchResult.payment.id,
      onchainReceiptTx: fetchResult.transactionHash,
    });
  }

  runCheck(facilityId: string): CovenantCheckResult | null {
    return getAppStore().evaluateLatestEvidence(facilityId);
  }
}
