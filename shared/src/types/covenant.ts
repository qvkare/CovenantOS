export type CovenantType = "DSCR" | "LTV" | "AGING" | "RESERVE" | "OTHER";

export type CovenantCadence = "daily" | "weekly" | "monthly" | "quarterly";

export interface ExtractedCovenant {
  type: CovenantType;
  threshold: number;
  cadence: CovenantCadence;
  sourceQuote: string;
  confidence: number;
}

export interface CovenantRecord extends ExtractedCovenant {
  id: string;
  facilityId: string;
  onchainRef?: string;
  humanVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
