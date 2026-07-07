import type { EvidenceProviderResponse } from "@covenantos/shared";
import {
  bankPayloadFromEvidence,
  evaluateCovenants,
  getDemoStore,
  type CovenantEvaluation,
  type CovenantCheckResult,
} from "@covenantos/shared";
import type { ChainWriter } from "../../chain/writer.js";
import { ChainWriter as DefaultChainWriter } from "../../chain/writer.js";
import { validateEvidencePayload } from "../../security/evidence-guard.js";
import type { EvidenceFetchResult } from "../../x402/gateway.js";

/** Require at least one recorded evidence item before proposing hold (human approval follows). */
export const MIN_EVIDENCE_FOR_PROPOSE = 1;

export type ProcessEvidenceInput = {
  facilityId: string;
  data: EvidenceProviderResponse;
  paymentRef?: string;
  onchainReceiptTx?: string;
};

export class CovenantAgent {
  constructor(private readonly chainWriter: ChainWriter = new DefaultChainWriter()) {}

  async processEvidence(input: ProcessEvidenceInput): Promise<CovenantCheckResult | null> {
    const store = getDemoStore();
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
      (await this.chainWriter.recordEvidence(input.data.payloadHash, input.facilityId));

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
      await this.chainWriter.proposeAction({
        facilityId: input.facilityId,
        actionType: "hold",
        paramsHash: result.action.paramsHash ?? result.action.id,
      });
    }

    if (result.status === "release_pending") {
      await this.chainWriter.proposeAction({
        facilityId: input.facilityId,
        actionType: "release",
        paramsHash: result.action.paramsHash ?? result.action.id,
      });
    }

    return result;
  }

  async ingestFetchResult(
    facilityId: string,
    fetchResult: EvidenceFetchResult,
  ): Promise<CovenantCheckResult | null> {
    return this.processEvidence({
      facilityId,
      data: fetchResult.data,
      paymentRef: fetchResult.payment.id,
      onchainReceiptTx: fetchResult.transactionHash,
    });
  }

  runCheck(facilityId: string): CovenantCheckResult | null {
    return getDemoStore().evaluateLatestEvidence(facilityId);
  }
}
