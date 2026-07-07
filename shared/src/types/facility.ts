export type FacilityStatus = "active" | "paused" | "breach" | "closed";

export interface Facility {
  id: string;
  name: string;
  issuer: string;
  onchainPackageHash?: string;
  status: FacilityStatus;
  escrowBalanceCache: string;
  createdAt: string;
  updatedAt: string;
}
