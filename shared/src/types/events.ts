export type ChainEventType =
  | "ActionProposed"
  | "ActionApproved"
  | "ActionExecutable"
  | "FacilityPaused"
  | "EvidenceRecorded"
  | "Deposited"
  | "Held"
  | "Released"
  | "ReserveToppedUp"
  | "BreachDetected";

export interface ChainEvent {
  id: string;
  type: ChainEventType;
  facilityId?: string;
  payload: Record<string, unknown>;
  txHash?: string;
  blockHeight?: number;
  createdAt: string;
}
