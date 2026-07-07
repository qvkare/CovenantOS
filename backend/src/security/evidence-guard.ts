const INJECTION_PATTERN =
  /ignore\s+(all\s+)?(prior\s+)?instructions|system\s*prompt|<\/?script|javascript:|approve\s+hold|override\s+covenant/i;

export type EvidenceGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateEvidencePayload(payload: Record<string, unknown>): EvidenceGuardResult {
  const serialized = JSON.stringify(payload);

  if (INJECTION_PATTERN.test(serialized)) {
    return { ok: false, reason: "adversarial_instruction_detected" };
  }

  const dscr = payload.dscr;
  if (typeof dscr === "number" && (dscr < 0 || dscr > 50)) {
    return { ok: false, reason: "dscr_out_of_range" };
  }

  const agingPct = payload.agingPct;
  if (typeof agingPct === "number" && (agingPct < 0 || agingPct > 1)) {
    return { ok: false, reason: "aging_pct_out_of_range" };
  }

  const cashBalance = payload.cashBalance;
  if (typeof cashBalance === "number" && (cashBalance < 0 || cashBalance > 1_000_000_000_000)) {
    return { ok: false, reason: "cash_balance_out_of_range" };
  }

  return { ok: true };
}
