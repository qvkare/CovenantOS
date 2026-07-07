import type { CovenantRecord, ExtractedCovenant } from "@covenantos/shared";

export const HUMAN_REVIEW_CONFIDENCE_THRESHOLD = 0.85;

export type ExtractionProviderName = "claude" | "heuristic";

export type ValidatedCovenant = ExtractedCovenant & {
  warnings: string[];
  needsHumanReview: boolean;
};

export type DocumentExtractionResult = {
  documentId: string;
  filename: string;
  covenants: CovenantRecord[];
  provider: ExtractionProviderName;
  warnings: string[];
};

export type LlmExtractionInput = {
  text: string;
  filename: string;
};
