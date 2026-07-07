import type { CovenantRecord, CovenantType } from "../types/covenant.js";

export interface BankEvidencePayload {
  dscr?: number;
  agingPct?: number;
  cashBalance?: number;
  scenario?: string;
}

export interface CovenantBreach {
  covenantId: string;
  type: CovenantType;
  observed: number;
  threshold: number;
  severity: "warning" | "breach";
  message: string;
}

export interface CovenantEvaluation {
  status: "ok" | "warning" | "breach";
  breaches: CovenantBreach[];
}

const AGING_PCT_MAX = 0.15;

function evaluateOne(
  covenant: CovenantRecord,
  payload: BankEvidencePayload,
): CovenantBreach | null {
  switch (covenant.type) {
    case "DSCR": {
      const observed = payload.dscr;
      if (observed === undefined) return null;
      if (observed < covenant.threshold) {
        return {
          covenantId: covenant.id,
          type: covenant.type,
          observed,
          threshold: covenant.threshold,
          severity: "breach",
          message: `DSCR ${observed} below minimum ${covenant.threshold}`,
        };
      }
      if (observed < covenant.threshold * 1.05) {
        return {
          covenantId: covenant.id,
          type: covenant.type,
          observed,
          threshold: covenant.threshold,
          severity: "warning",
          message: `DSCR ${observed} within 5% of minimum ${covenant.threshold}`,
        };
      }
      return null;
    }
    case "AGING": {
      const observed = payload.agingPct;
      if (observed === undefined) return null;
      if (observed > AGING_PCT_MAX) {
        return {
          covenantId: covenant.id,
          type: covenant.type,
          observed,
          threshold: AGING_PCT_MAX,
          severity: "breach",
          message: `Past-due receivables ${(observed * 100).toFixed(1)}% exceed ${AGING_PCT_MAX * 100}% limit`,
        };
      }
      return null;
    }
    default:
      return null;
  }
}

export function evaluateCovenants(
  covenants: CovenantRecord[],
  payload: BankEvidencePayload,
): CovenantEvaluation {
  const breaches = covenants
    .map((covenant) => evaluateOne(covenant, payload))
    .filter((item): item is CovenantBreach => item !== null);

  const hasBreach = breaches.some((b) => b.severity === "breach");
  const hasWarning = breaches.some((b) => b.severity === "warning");

  return {
    status: hasBreach ? "breach" : hasWarning ? "warning" : "ok",
    breaches,
  };
}

export function bankPayloadFromEvidence(
  raw: Record<string, unknown> | undefined,
): BankEvidencePayload {
  if (!raw) return {};
  return {
    dscr: typeof raw.dscr === "number" ? raw.dscr : undefined,
    agingPct: typeof raw.agingPct === "number" ? raw.agingPct : undefined,
    cashBalance: typeof raw.cashBalance === "number" ? raw.cashBalance : undefined,
    scenario: typeof raw.scenario === "string" ? raw.scenario : undefined,
  };
}
