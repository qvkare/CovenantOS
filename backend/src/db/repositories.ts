import type { Pool } from "pg";
import type {
  AuditEntry,
  CovenantRecord,
  EscrowState,
  FacilitySummary,
  ProposedAction,
} from "@covenantos/shared";
import type { Evidence } from "@covenantos/shared";

export async function countFacilities(pool: Pool): Promise<number> {
  const result = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM facilities");
  return Number(result.rows[0]?.count ?? 0);
}

export async function upsertFacility(pool: Pool, facility: FacilitySummary, escrow: EscrowState): Promise<void> {
  await pool.query(
    `INSERT INTO facilities (
      id, name, issuer, onchain_package_hash, status, escrow_balance_cache, escrow_state,
      covenant_ok, covenant_warning, covenant_breach, last_checked_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      issuer = EXCLUDED.issuer,
      onchain_package_hash = EXCLUDED.onchain_package_hash,
      status = EXCLUDED.status,
      escrow_balance_cache = EXCLUDED.escrow_balance_cache,
      escrow_state = EXCLUDED.escrow_state,
      covenant_ok = EXCLUDED.covenant_ok,
      covenant_warning = EXCLUDED.covenant_warning,
      covenant_breach = EXCLUDED.covenant_breach,
      last_checked_at = EXCLUDED.last_checked_at,
      updated_at = EXCLUDED.updated_at`,
    [
      facility.id,
      facility.name,
      facility.issuer,
      facility.onchainPackageHash ?? null,
      facility.status,
      facility.escrowBalanceCache,
      JSON.stringify(escrow),
      facility.covenantOk ?? 0,
      facility.covenantWarning ?? 0,
      facility.covenantBreach ?? 0,
      facility.lastCheckedAt ?? null,
      facility.createdAt,
      facility.updatedAt,
    ],
  );
}

export async function upsertCovenant(pool: Pool, covenant: CovenantRecord): Promise<void> {
  await pool.query(
    `INSERT INTO covenants (
      id, facility_id, type, threshold, cadence, source_quote, confidence,
      human_verified, onchain_ref, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (id) DO UPDATE SET
      type = EXCLUDED.type,
      threshold = EXCLUDED.threshold,
      cadence = EXCLUDED.cadence,
      source_quote = EXCLUDED.source_quote,
      confidence = EXCLUDED.confidence,
      human_verified = EXCLUDED.human_verified,
      onchain_ref = EXCLUDED.onchain_ref,
      updated_at = EXCLUDED.updated_at`,
    [
      covenant.id,
      covenant.facilityId,
      covenant.type,
      covenant.threshold,
      covenant.cadence,
      covenant.sourceQuote,
      covenant.confidence,
      covenant.humanVerified,
      covenant.onchainRef ?? null,
      covenant.createdAt,
      covenant.updatedAt,
    ],
  );
}

export async function upsertEvidence(pool: Pool, evidence: Evidence): Promise<void> {
  await pool.query(
    `INSERT INTO evidence (
      id, facility_id, source_id, payload_hash, x402_payment_ref, onchain_receipt_tx, raw_payload, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (id) DO NOTHING`,
    [
      evidence.id,
      evidence.facilityId,
      evidence.sourceId,
      evidence.payloadHash,
      evidence.x402PaymentRef ?? null,
      evidence.onchainReceiptTx ?? null,
      JSON.stringify(evidence.rawPayload ?? {}),
      evidence.createdAt,
    ],
  );
}

export async function upsertAction(pool: Pool, action: ProposedAction): Promise<void> {
  await pool.query(
    `INSERT INTO actions (
      id, facility_id, type, status, evidence_ids, proposed_by_agent,
      onchain_action_id, propose_tx_hash, execution_tx_hash, params_hash,
      reasoning_summary, required_approval_weight, current_approval_weight,
      created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      onchain_action_id = EXCLUDED.onchain_action_id,
      propose_tx_hash = EXCLUDED.propose_tx_hash,
      execution_tx_hash = EXCLUDED.execution_tx_hash,
      current_approval_weight = EXCLUDED.current_approval_weight,
      updated_at = EXCLUDED.updated_at`,
    [
      action.id,
      action.facilityId,
      action.type,
      action.status,
      JSON.stringify(action.evidenceIds),
      action.proposedByAgent,
      action.onchainActionId ?? null,
      action.proposeTxHash ?? null,
      action.executionTxHash ?? null,
      action.paramsHash ?? null,
      action.reasoningSummary ?? null,
      action.requiredApprovalWeight,
      action.currentApprovalWeight,
      action.createdAt,
      action.updatedAt,
    ],
  );
}

export async function insertApproval(
  pool: Pool,
  input: { id: string; actionId: string; approver: string; weight: number; txHash?: string; createdAt: string },
): Promise<void> {
  await pool.query(
    `INSERT INTO approvals (id, action_id, approver, weight, tx_hash, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO NOTHING`,
    [input.id, input.actionId, input.approver, input.weight, input.txHash ?? null, input.createdAt],
  );
}

export async function upsertAuditEntry(pool: Pool, entry: AuditEntry): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log (
      id, facility_id, decision_id, actor, action_type, reasoning_summary,
      policy_outcome, evidence_hashes, approval_txs, execution_tx, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (id) DO UPDATE SET
      approval_txs = EXCLUDED.approval_txs,
      execution_tx = EXCLUDED.execution_tx,
      policy_outcome = EXCLUDED.policy_outcome`,
    [
      entry.decisionId,
      entry.facilityId,
      entry.decisionId,
      entry.actor,
      entry.actionType ?? null,
      entry.reasoningSummary,
      entry.policyOutcome,
      JSON.stringify(entry.evidenceHashes),
      JSON.stringify(entry.approvalTxs),
      entry.executionTx ?? null,
      entry.createdAt,
    ],
  );
}

export async function insertX402Payment(
  pool: Pool,
  input: {
    id: string;
    provider: string;
    amountMotes: string;
    budgetRemainingMotes: string;
    requestHash: string;
    responseHash: string;
    facilityId?: string;
    createdAt: string;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO x402_payments (
      id, provider, amount_motes, budget_remaining_motes, request_hash, response_hash, facility_id, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (id) DO NOTHING`,
    [
      input.id,
      input.provider,
      input.amountMotes,
      input.budgetRemainingMotes,
      input.requestHash,
      input.responseHash,
      input.facilityId ?? null,
      input.createdAt,
    ],
  );
}

export async function truncateAppTables(pool: Pool): Promise<void> {
  await pool.query(`
    TRUNCATE TABLE
      approvals,
      audit_log,
      actions,
      evidence,
      documents,
      covenants,
      x402_payments,
      facilities
    RESTART IDENTITY CASCADE
  `);
}
