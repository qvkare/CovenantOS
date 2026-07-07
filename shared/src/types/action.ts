export type ActionType = "hold" | "release" | "top_up" | "pause";

export type ActionStatus =
  | "proposed"
  | "approved"
  | "executable"
  | "executed"
  | "rejected";

export interface ProposedAction {
  id: string;
  facilityId: string;
  type: ActionType;
  status: ActionStatus;
  evidenceIds: string[];
  proposedByAgent: string;
  onchainActionId?: string;
  paramsHash?: string;
  reasoningSummary?: string;
  requiredApprovalWeight: number;
  currentApprovalWeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  actionId: string;
  approver: string;
  weight: number;
  txHash?: string;
  createdAt: string;
}
