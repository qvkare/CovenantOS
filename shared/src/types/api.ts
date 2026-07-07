import type { ProposedAction } from "./action.js";
import type { CovenantRecord } from "./covenant.js";
import type { Evidence } from "./evidence.js";
import type { Facility } from "./facility.js";

export interface FacilitySummary extends Facility {
  covenantOk: number;
  covenantWarning: number;
  covenantBreach: number;
  lastCheckedAt?: string;
}

export interface EscrowState {
  balance: string;
  held: string;
  released: string;
  reserve: string;
  recentTxs: Array<{ type: string; amount: string; txHash: string; at: string }>;
}

export interface FacilityDetailResponse {
  facility: FacilitySummary;
  covenants: CovenantRecord[];
  evidence: Evidence[];
  escrow: EscrowState;
}

export interface AuditEntry {
  decisionId: string;
  facilityId: string;
  actionType?: string;
  actor: string;
  reasoningSummary?: string;
  policyOutcome?: string;
  evidenceHashes: string[];
  approvalTxs: string[];
  executionTx?: string;
  createdAt: string;
}

export function isPendingAction(status: ProposedAction["status"]): boolean {
  return status === "proposed" || status === "approved";
}
