import type { ExtractedCovenant } from "@covenantos/shared";
import type { LlmExtractionInput } from "../types.js";

export interface CovenantExtractionProvider {
  readonly name: "claude" | "heuristic";
  extract(input: LlmExtractionInput): Promise<ExtractedCovenant[]>;
}
