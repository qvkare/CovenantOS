export interface X402PaymentRequired {
  address: string;
  amountMotes: string;
  network: "casper";
}

export interface X402PaymentRecord {
  id: string;
  provider: string;
  amountMotes: string;
  budgetRemainingMotes: string;
  requestHash: string;
  responseHash: string;
  facilityId?: string;
  createdAt: string;
}

export interface EvidenceProviderResponse {
  sourceId: string;
  payload: Record<string, unknown>;
  payloadHash: string;
}
