import type { ProposedAction } from "../types/action.js";
import {
  isPendingAction,
  type AuditEntry,
  type EscrowState,
  type FacilitySummary,
} from "../types/api.js";
import type { CovenantRecord } from "../types/covenant.js";
import type { Evidence } from "../types/evidence.js";
import type { ChainEvent } from "../types/events.js";
import {
  bankPayloadFromEvidence,
  evaluateCovenants,
  type CovenantEvaluation,
} from "../covenant/evaluate.js";

export const DEMO_FACILITY_IDS = {
  healthy: "fac-demo-001",
  breach: "fac-demo-002",
} as const;

function clone<T>(value: T): T {
  return structuredClone(value);
}

const INITIAL_FACILITIES: FacilitySummary[] = [
  {
    id: DEMO_FACILITY_IDS.healthy,
    name: "Northwind Invoice Facility",
    issuer: "01issuer0000000000000000000000000000000000000000000000000000000001",
    status: "active",
    escrowBalanceCache: "4500000000000",
    onchainPackageHash:
      "package-7a3f9c2e1b8d4f6a0c5e9b2d7f1a4c8e3b6d9f2a5c1e8b4d7f0a3c6e9b2d5f8",
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-07-07T12:00:00.000Z",
    covenantOk: 3,
    covenantWarning: 0,
    covenantBreach: 0,
    lastCheckedAt: "2026-07-07T11:45:00.000Z",
  },
  {
    id: DEMO_FACILITY_IDS.breach,
    name: "Atlas Receivables Pool",
    issuer: "01issuer0000000000000000000000000000000000000000000000000000000002",
    status: "active",
    escrowBalanceCache: "8200000000000",
    onchainPackageHash:
      "package-2c8e1f4a9b6d3e7f0a5c9b2d6e1f4a8c3b7d0e5f9a2c6b1d8e4f7a0c3b6e9d2f5",
    createdAt: "2026-02-15T08:30:00.000Z",
    updatedAt: "2026-07-07T12:00:00.000Z",
    covenantOk: 3,
    covenantWarning: 0,
    covenantBreach: 0,
    lastCheckedAt: "2026-07-07T11:30:00.000Z",
  },
];

const INITIAL_COVENANTS: Record<string, CovenantRecord[]> = {
  [DEMO_FACILITY_IDS.healthy]: [
    {
      id: "cov-001",
      facilityId: DEMO_FACILITY_IDS.healthy,
      type: "DSCR",
      threshold: 1.25,
      cadence: "monthly",
      sourceQuote:
        "Borrower shall maintain a Debt Service Coverage Ratio of not less than 1.25x tested monthly.",
      confidence: 0.94,
      humanVerified: true,
      onchainRef: "covenant-ref-dscr-001",
      createdAt: "2026-03-01T10:05:00.000Z",
      updatedAt: "2026-03-01T10:05:00.000Z",
    },
    {
      id: "cov-002",
      facilityId: DEMO_FACILITY_IDS.healthy,
      type: "AGING",
      threshold: 45,
      cadence: "weekly",
      sourceQuote:
        "No more than 15% of receivables may exceed 45 days past due at any test date.",
      confidence: 0.91,
      humanVerified: true,
      onchainRef: "covenant-ref-aging-002",
      createdAt: "2026-03-01T10:05:00.000Z",
      updatedAt: "2026-03-01T10:05:00.000Z",
    },
    {
      id: "cov-003",
      facilityId: DEMO_FACILITY_IDS.healthy,
      type: "RESERVE",
      threshold: 0.1,
      cadence: "monthly",
      sourceQuote:
        "Borrower shall maintain a liquidity reserve equal to at least 10% of outstanding principal.",
      confidence: 0.88,
      humanVerified: true,
      onchainRef: "covenant-ref-reserve-003",
      createdAt: "2026-03-01T10:05:00.000Z",
      updatedAt: "2026-03-01T10:05:00.000Z",
    },
  ],
  [DEMO_FACILITY_IDS.breach]: [
    {
      id: "cov-101",
      facilityId: DEMO_FACILITY_IDS.breach,
      type: "DSCR",
      threshold: 1.2,
      cadence: "monthly",
      sourceQuote:
        "Minimum DSCR of 1.20x tested monthly based on trailing three months.",
      confidence: 0.92,
      humanVerified: true,
      onchainRef: "covenant-ref-dscr-101",
      createdAt: "2026-02-15T08:35:00.000Z",
      updatedAt: "2026-02-15T08:35:00.000Z",
    },
    {
      id: "cov-102",
      facilityId: DEMO_FACILITY_IDS.breach,
      type: "LTV",
      threshold: 0.75,
      cadence: "monthly",
      sourceQuote:
        "Loan-to-value shall not exceed 75% based on appraised collateral.",
      confidence: 0.79,
      humanVerified: true,
      onchainRef: "covenant-ref-ltv-102",
      createdAt: "2026-02-15T08:35:00.000Z",
      updatedAt: "2026-02-15T08:35:00.000Z",
    },
    {
      id: "cov-103",
      facilityId: DEMO_FACILITY_IDS.breach,
      type: "AGING",
      threshold: 60,
      cadence: "weekly",
      sourceQuote:
        "Past-due receivables over 60 days shall not exceed 20% of pool balance.",
      confidence: 0.9,
      humanVerified: true,
      onchainRef: "covenant-ref-aging-103",
      createdAt: "2026-02-15T08:35:00.000Z",
      updatedAt: "2026-02-15T08:35:00.000Z",
    },
  ],
};

const INITIAL_EVIDENCE: Record<string, Evidence[]> = {
  [DEMO_FACILITY_IDS.healthy]: [
    {
      id: "ev-001",
      facilityId: DEMO_FACILITY_IDS.healthy,
      sourceId: "mock-bank-statement",
      payloadHash:
        "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      x402PaymentRef: "x402-pay-001",
      onchainReceiptTx:
        "deploy-healthy-evidence-001abcdef1234567890abcdef1234567890ab",
      rawPayload: { dscr: 1.42, agingPct: 0.08 },
      createdAt: "2026-07-07T11:40:00.000Z",
    },
  ],
  [DEMO_FACILITY_IDS.breach]: [],
};

const INITIAL_ESCROW: Record<string, EscrowState> = {
  [DEMO_FACILITY_IDS.healthy]: {
    balance: "4500000000000",
    held: "0",
    released: "500000000000",
    reserve: "450000000000",
    recentTxs: [
      {
        type: "Deposited",
        amount: "5000000000000",
        txHash: "deploy-deposit-001abcdef1234567890abcdef1234567890ab",
        at: "2026-03-01T11:00:00.000Z",
      },
    ],
  },
  [DEMO_FACILITY_IDS.breach]: {
    balance: "8200000000000",
    held: "0",
    released: "0",
    reserve: "820000000000",
    recentTxs: [
      {
        type: "Deposited",
        amount: "8200000000000",
        txHash: "deploy-deposit-101abcdef1234567890abcdef1234567890ab",
        at: "2026-02-15T09:00:00.000Z",
      },
    ],
  },
};

const INITIAL_ACTIONS: ProposedAction[] = [];

const INITIAL_AUDIT: Record<string, AuditEntry[]> = {
  [DEMO_FACILITY_IDS.healthy]: [
    {
      decisionId: "dec-h-001",
      facilityId: DEMO_FACILITY_IDS.healthy,
      actionType: "check",
      actor: "covenant-agent",
      reasoningSummary: "All covenants within threshold after monthly check.",
      policyOutcome: "no action required",
      evidenceHashes: [
        "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      ],
      approvalTxs: [],
      createdAt: "2026-07-07T11:45:00.000Z",
    },
  ],
  [DEMO_FACILITY_IDS.breach]: [],
};

export const GOLDEN_EXTRACTED_COVENANTS: CovenantRecord[] = [
  {
    id: "new-cov-1",
    facilityId: "pending",
    type: "DSCR",
    threshold: 1.25,
    cadence: "monthly",
    sourceQuote:
      "The Borrower shall maintain a Debt Service Coverage Ratio of not less than 1.25 to 1.00.",
    confidence: 0.93,
    humanVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "new-cov-2",
    facilityId: "pending",
    type: "AGING",
    threshold: 45,
    cadence: "weekly",
    sourceQuote:
      "Receivables aged in excess of forty-five (45) days shall not exceed fifteen percent (15%) of the pool.",
    confidence: 0.82,
    humanVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const EMPTY_ESCROW: EscrowState = {
  balance: "0",
  held: "0",
  released: "0",
  reserve: "0",
  recentTxs: [],
};

export type DemoEventListener = (event: ChainEvent) => void;

export type CovenantCheckResult =
  | { status: "ok"; evaluation: CovenantEvaluation }
  | { status: "warning"; evaluation: CovenantEvaluation }
  | { status: "breach"; evaluation: CovenantEvaluation; action?: ProposedAction }
  | { status: "release_pending"; action: ProposedAction }
  | { status: "no_evidence" };

export const POLICY_APPROVAL_WEIGHT = {
  hold: 2,
  release: 2,
  top_up: 1,
  pause: 2,
} as const;

export class DemoStore {
  private facilities: FacilitySummary[];
  private covenantsByFacility: Record<string, CovenantRecord[]>;
  private evidenceByFacility: Record<string, Evidence[]>;
  private escrowByFacility: Record<string, EscrowState>;
  private actions: ProposedAction[];
  private auditByFacility: Record<string, AuditEntry[]>;
  private draftCovenants: CovenantRecord[];
  private listeners = new Set<DemoEventListener>();

  constructor() {
    this.facilities = clone(INITIAL_FACILITIES);
    this.covenantsByFacility = clone(INITIAL_COVENANTS);
    this.evidenceByFacility = clone(INITIAL_EVIDENCE);
    this.escrowByFacility = clone(INITIAL_ESCROW);
    this.actions = clone(INITIAL_ACTIONS);
    this.auditByFacility = clone(INITIAL_AUDIT);
    this.draftCovenants = clone(GOLDEN_EXTRACTED_COVENANTS);
  }

  subscribe(listener: DemoEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: ChainEvent) {
    for (const listener of this.listeners) listener(event);
  }

  private now() {
    return new Date().toISOString();
  }

  listFacilities(): FacilitySummary[] {
    return [...this.facilities].sort((a, b) => {
      if (a.status === "breach" && b.status !== "breach") return -1;
      if (b.status === "breach" && a.status !== "breach") return 1;
      return 0;
    });
  }

  getFacility(id: string) {
    const facility = this.facilities.find((f) => f.id === id);
    if (!facility) return null;
    return {
      facility,
      covenants: this.covenantsByFacility[id] ?? [],
      evidence: this.evidenceByFacility[id] ?? [],
      escrow: this.escrowByFacility[id] ?? EMPTY_ESCROW,
    };
  }

  getCovenants(id: string) {
    return this.covenantsByFacility[id] ?? [];
  }

  getAudit(id: string) {
    return this.auditByFacility[id] ?? [];
  }

  getAction(id: string): ProposedAction | undefined {
    return this.actions.find((a) => a.id === id);
  }

  setActionChainIds(
    id: string,
    chainIds: { onchainActionId?: string; proposeTxHash?: string },
  ): ProposedAction | null {
    const action = this.actions.find((a) => a.id === id);
    if (!action) return null;

    if (chainIds.onchainActionId) {
      action.onchainActionId = chainIds.onchainActionId;
    }
    if (chainIds.proposeTxHash) {
      action.proposeTxHash = chainIds.proposeTxHash;
    }
    action.updatedAt = this.now();
    return action;
  }

  recordEvidence(
    facilityId: string,
    input: {
      sourceId: string;
      payloadHash: string;
      rawPayload: Record<string, unknown>;
      x402PaymentRef?: string;
      onchainReceiptTx?: string;
    },
  ): Evidence | null {
    const facility = this.facilities.find((f) => f.id === facilityId);
    if (!facility) return null;

    const now = this.now();
    const evidence: Evidence = {
      id: `ev-${Date.now()}`,
      facilityId,
      sourceId: input.sourceId,
      payloadHash: input.payloadHash,
      x402PaymentRef: input.x402PaymentRef,
      onchainReceiptTx: input.onchainReceiptTx,
      rawPayload: input.rawPayload,
      createdAt: now,
    };

    this.evidenceByFacility[facilityId] = [
      ...(this.evidenceByFacility[facilityId] ?? []),
      evidence,
    ];

    if (!this.auditByFacility[facilityId]) {
      this.auditByFacility[facilityId] = [];
    }
    this.auditByFacility[facilityId]!.unshift({
      decisionId: `dec-evidence-${Date.now()}`,
      facilityId,
      actionType: "evidence",
      actor: "x402-gateway",
      reasoningSummary: "Paid bank statement retrieved via x402 negotiation.",
      policyOutcome: "recorded",
      evidenceHashes: [input.payloadHash],
      approvalTxs: [],
      executionTx: input.onchainReceiptTx,
      createdAt: now,
    });

    this.emit({
      id: `evt-evidence-${Date.now()}`,
      type: "EvidenceRecorded",
      facilityId,
      payload: { evidenceId: evidence.id, payloadHash: input.payloadHash },
      txHash: input.onchainReceiptTx,
      createdAt: now,
    });

    return evidence;
  }

  applyCovenantEvaluation(
    facilityId: string,
    evaluation: CovenantEvaluation,
    evidence: Evidence,
  ): CovenantCheckResult {
    const facility = this.facilities.find((f) => f.id === facilityId);
    if (!facility) {
      return { status: "no_evidence" };
    }

    const now = this.now();
    const covenants = this.covenantsByFacility[facilityId] ?? [];
    const breachCount = evaluation.breaches.filter((b) => b.severity === "breach").length;
    const warningCount = evaluation.breaches.filter((b) => b.severity === "warning").length;

    facility.covenantBreach = breachCount;
    facility.covenantWarning = warningCount;
    facility.covenantOk = Math.max(0, covenants.length - breachCount - warningCount);
    facility.lastCheckedAt = now;
    facility.updatedAt = now;

    if (evaluation.status === "breach") {
      facility.status = "breach";

      const primary = evaluation.breaches.find((b) => b.severity === "breach");
      this.emit({
        id: `evt-breach-${Date.now()}`,
        type: "BreachDetected",
        facilityId,
        payload: {
          covenantType: primary?.type ?? "DSCR",
          observed: primary?.observed,
          threshold: primary?.threshold,
        },
        createdAt: now,
      });

      const pendingHold = this.actions.find(
        (a) =>
          a.facilityId === facilityId &&
          a.type === "hold" &&
          isPendingAction(a.status),
      );

      if (!pendingHold) {
        const holdAction = this.createHoldAction(
          facility,
          evidence.id,
          evidence.payloadHash,
          evaluation,
        );
        this.emit({
          id: `evt-proposed-${Date.now()}`,
          type: "ActionProposed",
          facilityId,
          payload: { actionId: holdAction.id, type: "hold" },
          createdAt: now,
        });
        return { status: "breach", evaluation, action: holdAction };
      }

      return { status: "breach", evaluation };
    }

    if (evaluation.status === "ok" && facility.status === "breach") {
      const holdExecuted = this.actions.some(
        (a) =>
          a.facilityId === facilityId && a.type === "hold" && a.status === "executed",
      );
      if (holdExecuted) {
        return this.proposeRelease(facility);
      }
    }

    if (evaluation.status === "ok") {
      this.emit({
        id: `evt-ok-${Date.now()}`,
        type: "EvidenceRecorded",
        facilityId,
        payload: { status: "ok" },
        createdAt: now,
      });
    }

    return { status: evaluation.status, evaluation };
  }

  evaluateLatestEvidence(facilityId: string): CovenantCheckResult | null {
    const facility = this.facilities.find((f) => f.id === facilityId);
    if (!facility) return null;

    const evidenceList = this.evidenceByFacility[facilityId] ?? [];
    const latest = evidenceList[evidenceList.length - 1];
    if (!latest) {
      return { status: "no_evidence" };
    }

    const covenants = this.covenantsByFacility[facilityId] ?? [];
    const payload = bankPayloadFromEvidence(latest.rawPayload);
    const evaluation = evaluateCovenants(covenants, payload);
    return this.applyCovenantEvaluation(facilityId, evaluation, latest);
  }

  extractCovenants() {
    return {
      documentId: "doc-new-001",
      covenants: clone(this.draftCovenants),
    };
  }

  registerFacility(input: {
    name: string;
    issuer: string;
    covenants: CovenantRecord[];
  }) {
    const id = `fac-${Date.now()}`;
    const now = this.now();
    const facility: FacilitySummary = {
      id,
      name: input.name,
      issuer: input.issuer,
      status: "active",
      escrowBalanceCache: "0",
      createdAt: now,
      updatedAt: now,
      covenantOk: input.covenants.length,
      covenantWarning: 0,
      covenantBreach: 0,
    };
    this.facilities.unshift(facility);
    this.covenantsByFacility[id] = input.covenants.map((c) => ({
      ...c,
      id: `${id}-${c.id}`,
      facilityId: id,
      humanVerified: true,
      onchainRef: `covenant-ref-${c.type.toLowerCase()}-${id.slice(-4)}`,
      createdAt: now,
      updatedAt: now,
    }));
    this.evidenceByFacility[id] = [];
    this.escrowByFacility[id] = { ...EMPTY_ESCROW };
    this.auditByFacility[id] = [];
    const txHashes = [
      `deploy-facility-${id.slice(-8)}abcdef1234567890abcdef1234567890ab`,
      `deploy-covenants-${id.slice(-8)}abcdef1234567890abcdef1234567890ab`,
    ];
    return { facility, txHashes };
  }

  updateCovenant(id: string, patch: Partial<CovenantRecord>) {
    for (const list of Object.values(this.covenantsByFacility)) {
      const idx = list.findIndex((c) => c.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx]!, ...patch, updatedAt: this.now() };
        return list[idx]!;
      }
    }
    const draft = this.draftCovenants.find((c) => c.id === id);
    if (draft) {
      Object.assign(draft, patch, { updatedAt: this.now() });
      return draft;
    }
    return null;
  }

  checkFacility(id: string): CovenantCheckResult | null {
    return this.evaluateLatestEvidence(id);
  }

  private createHoldAction(
    facility: FacilitySummary,
    evidenceId: string,
    payloadHash: string,
    evaluation: CovenantEvaluation,
  ) {
    const now = this.now();
    const primary =
      evaluation.breaches.find((b) => b.severity === "breach") ?? evaluation.breaches[0];
    const reasoningSummary = primary
      ? `${primary.message}; x402 bank statement (${payloadHash.slice(0, 8)}…) confirms breach. Recommend escrow hold pending remediation.`
      : "Covenant breach detected. Recommend escrow hold pending remediation.";

    const action: ProposedAction = {
      id: `act-hold-${Date.now()}`,
      facilityId: facility.id,
      type: "hold",
      status: "proposed",
      evidenceIds: [evidenceId],
      proposedByAgent: "covenant-agent",
      reasoningSummary,
      requiredApprovalWeight: POLICY_APPROVAL_WEIGHT.hold,
      currentApprovalWeight: 1,
      paramsHash: `params-hold-${facility.id.slice(-6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.actions.unshift(action);

    if (!this.auditByFacility[facility.id]) {
      this.auditByFacility[facility.id] = [];
    }
    this.auditByFacility[facility.id]!.unshift({
      decisionId: `dec-hold-${Date.now()}`,
      facilityId: facility.id,
      actionType: "hold",
      actor: "covenant-agent",
      reasoningSummary,
      policyOutcome: "proposed — awaiting officer approval",
      evidenceHashes: [payloadHash],
      approvalTxs: [],
      createdAt: now,
    });

    return action;
  }

  private proposeRelease(facility: FacilitySummary) {
    const existing = this.actions.find(
      (a) =>
        a.facilityId === facility.id &&
        a.type === "release" &&
        isPendingAction(a.status),
    );
    if (existing) {
      return { status: "release_pending" as const, action: existing };
    }

    const now = this.now();
    const action: ProposedAction = {
      id: `act-release-${Date.now()}`,
      facilityId: facility.id,
      type: "release",
      status: "proposed",
      evidenceIds: [],
      proposedByAgent: "covenant-agent",
      reasoningSummary:
        "Remediation evidence received; DSCR back within threshold. Recommend releasing held escrow.",
      requiredApprovalWeight: POLICY_APPROVAL_WEIGHT.release,
      currentApprovalWeight: 1,
      paramsHash: `params-release-${facility.id.slice(-6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.actions.unshift(action);
    this.emit({
      id: `evt-release-${Date.now()}`,
      type: "ActionProposed",
      facilityId: facility.id,
      payload: { actionId: action.id, type: "release" },
      createdAt: now,
    });
    return { status: "release_pending" as const, action };
  }

  listActions(status?: string) {
    if (!status || status === "all") return [...this.actions];
    if (status === "pending") {
      return this.actions.filter((a) => isPendingAction(a.status));
    }
    return this.actions.filter((a) => a.status === status);
  }

  approveAction(id: string, body: { approver: string; txHash?: string }) {
    const action = this.actions.find((a) => a.id === id);
    if (!action || !isPendingAction(action.status)) return null;

    const now = this.now();
    action.currentApprovalWeight = Math.min(
      action.requiredApprovalWeight,
      action.currentApprovalWeight + 1,
    );

    const approvalTx =
      body.txHash ??
      `deploy-approve-${id.slice(-6)}abcdef1234567890abcdef1234567890ab`;

    const audit = this.auditByFacility[action.facilityId] ?? [];
    const holdAudit = audit.find((e) => e.actionType === action.type);
    if (holdAudit) {
      holdAudit.approvalTxs = [...holdAudit.approvalTxs, approvalTx];
    }

    if (action.currentApprovalWeight >= action.requiredApprovalWeight) {
      action.status = "executable";
      this.emit({
        id: `evt-exec-ready-${Date.now()}`,
        type: "ActionExecutable",
        facilityId: action.facilityId,
        payload: { actionId: id, type: action.type },
        txHash: approvalTx,
        createdAt: now,
      });
    } else if (action.currentApprovalWeight > 1) {
      action.status = "approved";
    } else {
      action.status = "proposed";
    }

    action.updatedAt = now;
    return action;
  }

  executeAction(id: string, txHash?: string): ProposedAction | null {
    const action = this.actions.find((a) => a.id === id);
    if (!action || action.status !== "executable") return null;

    const now = this.now();
    const executionTx =
      txHash ??
      `deploy-exec-${id.slice(-6)}abcdef1234567890abcdef1234567890ab`;

    action.status = "executed";
    action.executionTxHash = executionTx;
    action.updatedAt = now;
    this.applyExecutedAction(action, executionTx);

    const audit = this.auditByFacility[action.facilityId] ?? [];
    const holdAudit = audit.find((e) => e.actionType === action.type);
    if (holdAudit) {
      holdAudit.executionTx = executionTx;
    }

    this.emit({
      id: `evt-exec-${Date.now()}`,
      type: "ActionExecutable",
      facilityId: action.facilityId,
      payload: { actionId: id, type: action.type, executed: true },
      txHash: executionTx,
      createdAt: now,
    });

    return action;
  }

  private applyExecutedAction(action: ProposedAction, txHash: string) {
    const escrow = this.escrowByFacility[action.facilityId];
    if (!escrow) return;
    const now = this.now();

    if (action.type === "hold") {
      const holdAmount = "1200000000000";
      escrow.held = holdAmount;
      escrow.recentTxs.unshift({
        type: "Held",
        amount: holdAmount,
        txHash,
        at: now,
      });
    }

    if (action.type === "release") {
      escrow.held = "0";
      escrow.released = "1200000000000";
      escrow.recentTxs.unshift({
        type: "Released",
        amount: "1200000000000",
        txHash,
        at: now,
      });
      const facility = this.facilities.find((f) => f.id === action.facilityId);
      if (facility) {
        facility.status = "active";
        facility.covenantOk = 3;
        facility.covenantWarning = 0;
        facility.covenantBreach = 0;
        facility.updatedAt = now;
      }
    }
  }

  rejectAction(id: string) {
    const action = this.actions.find((a) => a.id === id);
    if (!action) return null;
    action.status = "rejected";
    action.updatedAt = this.now();
    return action;
  }
}

let singleton: DemoStore | null = null;

export function getDemoStore(): DemoStore {
  if (!singleton) singleton = new DemoStore();
  return singleton;
}

export function resetDemoStore(): void {
  singleton = new DemoStore();
}
