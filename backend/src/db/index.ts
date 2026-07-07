import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolConfig } from "pg";
import type { ChainEvent } from "@covenantos/shared";
import { insertChainEvent, listChainEvents, type PersistChainEventInput } from "./chain-events.js";
import { isDatabaseEnabled, loadDatabaseUrl } from "./config.js";

let pool: Pool | undefined;

function schemaSql(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return fs.readFileSync(path.join(here, "schema.sql"), "utf8");
}

export async function initDatabase(): Promise<boolean> {
  const url = loadDatabaseUrl();
  if (!url) return false;

  const config: PoolConfig = { connectionString: url };
  pool = new Pool(config);

  try {
    await pool.query(schemaSql());
    return true;
  } catch (error) {
    await pool.end().catch(() => undefined);
    pool = undefined;
    throw error;
  }
}

export function getPool(): Pool | undefined {
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}

export async function persistChainEvent(event: PersistChainEventInput): Promise<boolean> {
  if (!pool) return false;
  return insertChainEvent(pool, event);
}

export async function queryChainEvents(
  query: { limit?: number; facilityId?: string; since?: string } = {},
): Promise<ChainEvent[]> {
  if (!pool) return [];
  return listChainEvents(pool, query);
}

export { isDatabaseEnabled, loadDatabaseUrl };
