import type { ExtractedCovenant } from "@covenantos/shared";
import {
  HUMAN_REVIEW_CONFIDENCE_THRESHOLD,
  type ValidatedCovenant,
} from "./types.js";

function rangeWarning(type: ExtractedCovenant["type"], threshold: number): string | null {
  switch (type) {
    case "DSCR":
      if (threshold < 0.5 || threshold > 5) {
        return "DSCR threshold outside expected range (0.5–5.0)";
      }
      return null;
    case "LTV":
    case "RESERVE":
      if (threshold <= 0 || threshold > 1) {
        return `${type} threshold should be a ratio between 0 and 1`;
      }
      return null;
    case "AGING":
      if (threshold < 1 || threshold > 365) {
        return "Aging threshold should be between 1 and 365 days";
      }
      return null;
    default:
      if (threshold <= 0) {
        return "Threshold must be positive";
      }
      return null;
  }
}

export function validateExtractedCovenant(
  covenant: ExtractedCovenant,
): ValidatedCovenant {
  const warnings: string[] = [];

  if (!covenant.sourceQuote.trim()) {
    warnings.push("Missing source quote");
  } else if (covenant.sourceQuote.trim().length < 12) {
    warnings.push("Source quote is too short");
  }

  if (covenant.confidence < 0 || covenant.confidence > 1) {
    warnings.push("Confidence must be between 0 and 1");
  }

  const range = rangeWarning(covenant.type, covenant.threshold);
  if (range) {
    warnings.push(range);
  }

  const needsHumanReview =
    covenant.confidence < HUMAN_REVIEW_CONFIDENCE_THRESHOLD || warnings.length > 0;

  return { ...covenant, warnings, needsHumanReview };
}

export function validateExtractedCovenants(
  covenants: ExtractedCovenant[],
): ValidatedCovenant[] {
  return covenants.map(validateExtractedCovenant);
}
