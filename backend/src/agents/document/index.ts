import { randomUUID } from "node:crypto";
import type { CovenantRecord } from "@covenantos/shared";
import { parseDocument } from "./parse-document.js";
import { ClaudeExtractionProvider } from "./providers/claude.js";
import { HeuristicExtractionProvider } from "./providers/heuristic.js";
import type { CovenantExtractionProvider } from "./providers/llm-provider.js";
import { validateExtractedCovenants } from "./validate-covenants.js";
import type { DocumentExtractionResult, LlmExtractionInput } from "./types.js";

function toCovenantRecords(
  validated: ReturnType<typeof validateExtractedCovenants>,
): CovenantRecord[] {
  const now = new Date().toISOString();

  return validated.map((covenant, index) => ({
    id: `new-cov-${index + 1}`,
    facilityId: "pending",
    type: covenant.type,
    threshold: covenant.threshold,
    cadence: covenant.cadence,
    sourceQuote: covenant.sourceQuote,
    confidence: covenant.confidence,
    humanVerified: !covenant.needsHumanReview,
    createdAt: now,
    updatedAt: now,
  }));
}

function resolveProvider(): CovenantExtractionProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "test") {
      return new HeuristicExtractionProvider();
    }
    throw new Error("ANTHROPIC_API_KEY is required for document extraction");
  }

  const model =
    process.env.ANTHROPIC_MODEL?.trim() ?? "claude-3-5-haiku-20241022";
  return new ClaudeExtractionProvider(apiKey, model);
}

export class DocumentAgent {
  constructor(private readonly provider: CovenantExtractionProvider = resolveProvider()) {}

  async extractFromText(input: LlmExtractionInput): Promise<DocumentExtractionResult> {
    const extracted = await this.provider.extract(input);
    const validated = validateExtractedCovenants(extracted);
    const warnings = validated.flatMap((covenant) => covenant.warnings);

    return {
      documentId: `doc-${randomUUID().slice(0, 8)}`,
      filename: input.filename,
      covenants: toCovenantRecords(validated),
      provider: this.provider.name,
      warnings,
    };
  }

  async extractFromUpload(
    buffer: Buffer,
    filename: string,
  ): Promise<DocumentExtractionResult> {
    const text = await parseDocument(buffer, filename);
    if (!text.trim()) {
      throw new Error("Document contained no readable text");
    }

    return this.extractFromText({ text, filename });
  }
}

export { HUMAN_REVIEW_CONFIDENCE_THRESHOLD } from "./types.js";
export { parseDocument } from "./parse-document.js";
export { validateExtractedCovenants } from "./validate-covenants.js";
