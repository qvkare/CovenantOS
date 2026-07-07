import { randomUUID } from "node:crypto";
import type { DemoStore } from "@covenantos/shared";
import {
  getDemoStore,
  type CovenantRecord,
  type FacilitySummary,
  type ProposedAction,
} from "@covenantos/shared";
import { getPool } from "../db/index.js";
import {
  countFacilities,
  insertApproval,
  insertX402Payment,
  truncateAppTables,
  upsertAction,
  upsertAuditEntry,
  upsertCovenant,
  upsertEvidence,
  upsertFacility,
} from "../db/repositories.js";

type DemoStoreApi = DemoStore;

export class PersistingStore {
  private get inner(): DemoStoreApi {
    return getDemoStore();
  }

  subscribe(listener: Parameters<DemoStoreApi["subscribe"]>[0]) {
    return this.inner.subscribe(listener);
  }

  listFacilities() {
    return this.inner.listFacilities();
  }

  getFacility(id: string) {
    return this.inner.getFacility(id);
  }

  getCovenants(id: string) {
    return this.inner.getCovenants(id);
  }

  getAudit(id: string) {
    return this.inner.getAudit(id);
  }

  getAction(id: string) {
    return this.inner.getAction(id);
  }

  extractCovenants() {
    return this.inner.extractCovenants();
  }

  listActions(status?: string) {
    return this.inner.listActions(status);
  }

  evaluateLatestEvidence(facilityId: string) {
    return this.inner.evaluateLatestEvidence(facilityId);
  }

  checkFacility(id: string) {
    return this.inner.checkFacility(id);
  }

  recordEvidence(...args: Parameters<DemoStoreApi["recordEvidence"]>) {
    const result = this.inner.recordEvidence(...args);
    if (result) void this.persistEvidence(result);
    return result;
  }

  applyCovenantEvaluation(...args: Parameters<DemoStoreApi["applyCovenantEvaluation"]>) {
    const result = this.inner.applyCovenantEvaluation(...args);
    void this.persistFacilityState(args[0]);
    if ("action" in result && result.action) void this.persistAction(result.action);
    const audit = this.inner.getAudit(args[0]);
    const latest = audit[0];
    if (latest) void this.persistAudit(latest);
    return result;
  }

  registerFacility(...args: Parameters<DemoStoreApi["registerFacility"]>) {
    const result = this.inner.registerFacility(...args);
    const detail = this.inner.getFacility(result.facility.id);
    if (detail) {
      void this.persistFacilityRegistration(result.facility, detail.covenants);
    }
    return result;
  }

  updateCovenant(...args: Parameters<DemoStoreApi["updateCovenant"]>) {
    const result = this.inner.updateCovenant(...args);
    if (result) void this.persistCovenant(result);
    return result;
  }

  setActionChainIds(...args: Parameters<DemoStoreApi["setActionChainIds"]>) {
    const result = this.inner.setActionChainIds(...args);
    if (result) void this.persistAction(result);
    return result;
  }

  bindOnChainActionId(...args: Parameters<DemoStoreApi["bindOnChainActionId"]>) {
    this.inner.bindOnChainActionId(...args);
    const action = this.inner.listActions().find((a) => a.proposeTxHash === args[0]);
    if (action) void this.persistAction(action);
  }

  recordChainVaultExecution(...args: Parameters<DemoStoreApi["recordChainVaultExecution"]>) {
    this.inner.recordChainVaultExecution(...args);
    void this.persistFacilityState(args[0]);
    const audit = this.inner.getAudit(args[0]).find((e) => e.actionType === "hold" || e.actionType === "release");
    if (audit) void this.persistAudit(audit);
  }

  approveAction(...args: Parameters<DemoStoreApi["approveAction"]>) {
    const result = this.inner.approveAction(...args);
    if (result) {
      void this.persistAction(result);
      void this.persistApproval(result.id, args[1]);
    }
    return result;
  }

  executeAction(...args: Parameters<DemoStoreApi["executeAction"]>) {
    const result = this.inner.executeAction(...args);
    if (result) {
      void this.persistAction(result);
      void this.persistFacilityState(result.facilityId);
      const audit = this.inner.getAudit(result.facilityId).find((e) => e.actionType === result.type);
      if (audit) void this.persistAudit(audit);
    }
    return result;
  }

  rejectAction(...args: Parameters<DemoStoreApi["rejectAction"]>) {
    const result = this.inner.rejectAction(...args);
    if (result) void this.persistAction(result);
    return result;
  }

  async persistX402Payment(input: {
    id: string;
    provider: string;
    amountMotes: string;
    budgetRemainingMotes: string;
    requestHash: string;
    responseHash: string;
    facilityId?: string;
    createdAt: string;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await insertX402Payment(pool, input);
  }

  private async persistFacilityState(facilityId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    const detail = this.inner.getFacility(facilityId);
    if (!detail) return;
    await upsertFacility(pool, detail.facility, detail.escrow);
  }

  private async persistFacilityRegistration(
    facility: FacilitySummary,
    covenants: CovenantRecord[],
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await upsertFacility(pool, facility, {
      balance: facility.escrowBalanceCache,
      held: "0",
      released: "0",
      reserve: "0",
      recentTxs: [],
    });
    for (const covenant of covenants) {
      await upsertCovenant(pool, { ...covenant, facilityId: facility.id });
    }
  }

  private async persistCovenant(covenant: CovenantRecord): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await upsertCovenant(pool, covenant);
  }

  private async persistEvidence(evidence: NonNullable<ReturnType<DemoStoreApi["recordEvidence"]>>) {
    const pool = getPool();
    if (!pool) return;
    await upsertEvidence(pool, evidence);
    await this.persistFacilityState(evidence.facilityId);
  }

  private async persistAction(action: ProposedAction): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await upsertAction(pool, action);
  }

  private async persistApproval(
    actionId: string,
    body: { approver: string; txHash?: string },
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await insertApproval(pool, {
      id: randomUUID(),
      actionId,
      approver: body.approver,
      weight: 1,
      txHash: body.txHash,
      createdAt: new Date().toISOString(),
    });
  }

  private async persistAudit(
    entry: NonNullable<ReturnType<DemoStoreApi["getAudit"]>>[number],
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await upsertAuditEntry(pool, entry);
  }
}

const store = new PersistingStore();

export function getAppStore(): PersistingStore {
  return store;
}

export async function resetAppStorePersistence(): Promise<void> {
  const pool = getPool();
  if (pool) {
    await truncateAppTables(pool);
    await pool.query("TRUNCATE TABLE chain_events");
  }
}

export async function ensureAppStoreSeeded(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  const count = await countFacilities(pool);
  if (count > 0) return;

  const appStore = getAppStore();
  for (const facility of appStore.listFacilities()) {
    const detail = appStore.getFacility(facility.id);
    if (!detail) continue;
    await upsertFacility(pool, detail.facility, detail.escrow);
    for (const covenant of detail.covenants) {
      await upsertCovenant(pool, covenant);
    }
    for (const evidence of detail.evidence) {
      await upsertEvidence(pool, evidence);
    }
    for (const entry of store.getAudit(facility.id)) {
      await upsertAuditEntry(pool, entry);
    }
  }
  for (const action of appStore.listActions("all")) {
    await upsertAction(pool, action);
  }
}
