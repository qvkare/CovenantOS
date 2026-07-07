import type { ExtractedCovenant } from "@covenantos/shared";
import type { CovenantExtractionProvider } from "./llm-provider.js";
import type { LlmExtractionInput } from "../types.js";

function findQuote(text: string, pattern: RegExp, fallback: string): string {
  const match = text.match(pattern);
  return match?.[0]?.trim() ?? fallback;
}

function extractDscr(text: string): ExtractedCovenant | null {
  const thresholdMatch = text.match(
    /debt service coverage ratio[^.\n]{0,120}?(\d+(?:\.\d+)?)/i,
  );
  if (!thresholdMatch) {
    return null;
  }

  const threshold = Number(thresholdMatch[1]);
  const cadence = /tested monthly|monthly basis|each fiscal month/i.test(text)
    ? "monthly"
    : "quarterly";

  return {
    type: "DSCR",
    threshold,
    cadence,
    sourceQuote: findQuote(
      text,
      /debt service coverage ratio.{0,120}/i,
      `Debt Service Coverage Ratio of not less than ${threshold}`,
    ),
    confidence: 0.93,
  };
}

function extractAging(text: string): ExtractedCovenant | null {
  const parenDays = text.match(/forty-five\s*\(\s*(\d+)\s*\)\s*days/i);
  const numericDays = text.match(/aged in excess of\s+(\d+)\s*days/i);
  const threshold = Number(parenDays?.[1] ?? numericDays?.[1] ?? 0);

  if (!threshold || !/receivables|aging|past due/i.test(text)) {
    return null;
  }

  const cadence = /weekly|each week/i.test(text) ? "weekly" : "monthly";

  return {
    type: "AGING",
    threshold,
    cadence,
    sourceQuote: findQuote(
      text,
      /receivables aged.{0,120}/i,
      `Receivables aged in excess of ${threshold} days`,
    ),
    confidence: 0.82,
  };
}

function extractReserve(text: string): ExtractedCovenant | null {
  const pctMatch = text.match(
    /liquidity reserve[^.\n]{0,80}?(\d+(?:\.\d+)?)\s*(?:%|percent)/i,
  );
  if (!pctMatch) {
    return null;
  }

  const threshold = Number(pctMatch[1]) / 100;

  return {
    type: "RESERVE",
    threshold,
    cadence: /monthly/i.test(text) ? "monthly" : "quarterly",
    sourceQuote: findQuote(
      text,
      /liquidity reserve.{0,120}/i,
      `Liquidity reserve of at least ${pctMatch[1]}%`,
    ),
    confidence: 0.88,
  };
}

export class HeuristicExtractionProvider implements CovenantExtractionProvider {
  readonly name = "heuristic" as const;

  async extract(input: LlmExtractionInput): Promise<ExtractedCovenant[]> {
    const text = input.text;
    const covenants = [extractDscr(text), extractAging(text), extractReserve(text)].filter(
      (item): item is ExtractedCovenant => item !== null,
    );

    if (covenants.length === 0) {
      throw new Error("No covenants detected in document text");
    }

    return covenants;
  }
}
