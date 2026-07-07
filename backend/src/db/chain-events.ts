import type { ChainEvent } from "@covenantos/shared";
import type { Pool } from "pg";

export type PersistChainEventInput = ChainEvent & {
  source?: string;
  contractHash?: string;
  rawEvent?: unknown;
};

export async function insertChainEvent(
  pool: Pool,
  event: PersistChainEventInput,
): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO chain_events (
      id, event_type, facility_id, payload, tx_hash, block_height, contract_hash, source, raw_event, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO NOTHING`,
    [
      event.id,
      event.type,
      event.facilityId ?? null,
      JSON.stringify(event.payload ?? {}),
      event.txHash ?? null,
      event.blockHeight ?? null,
      event.contractHash ?? null,
      event.source ?? "local",
      event.rawEvent ? JSON.stringify(event.rawEvent) : null,
      event.createdAt,
    ],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function listChainEvents(
  pool: Pool,
  query: { limit?: number; facilityId?: string; since?: string } = {},
): Promise<ChainEvent[]> {
  const limit = Math.min(query.limit ?? 50, 200);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.facilityId) {
    params.push(query.facilityId);
    conditions.push(`facility_id = $${params.length}`);
  }

  if (query.since) {
    params.push(query.since);
    conditions.push(`created_at >= $${params.length}`);
  }

  params.push(limit);
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query<{
    id: string;
    event_type: string;
    facility_id: string | null;
    payload: Record<string, unknown>;
    tx_hash: string | null;
    block_height: string | null;
    created_at: Date;
  }>(
    `SELECT id, event_type, facility_id, payload, tx_hash, block_height, created_at
     FROM chain_events
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.event_type as ChainEvent["type"],
    facilityId: row.facility_id ?? undefined,
    payload: row.payload ?? {},
    txHash: row.tx_hash ?? undefined,
    blockHeight: row.block_height ? Number(row.block_height) : undefined,
    createdAt: row.created_at.toISOString(),
  }));
}
