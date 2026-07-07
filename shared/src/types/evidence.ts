export interface Evidence {
  id: string;
  facilityId: string;
  sourceId: string;
  payloadHash: string;
  x402PaymentRef?: string;
  onchainReceiptTx?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
}
