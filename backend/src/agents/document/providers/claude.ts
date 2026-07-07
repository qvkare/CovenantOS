import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedCovenant } from "@covenantos/shared";
import { z } from "zod";
import type { CovenantExtractionProvider } from "./llm-provider.js";
import type { LlmExtractionInput } from "../types.js";

const extractedCovenantSchema = z.object({
  type: z.enum(["DSCR", "LTV", "AGING", "RESERVE", "OTHER"]),
  threshold: z.number(),
  cadence: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  sourceQuote: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const extractionResponseSchema = z.object({
  covenants: z.array(extractedCovenantSchema).min(1),
});

const SYSTEM_PROMPT = `You extract financial covenants from credit facility documents.
Return JSON only with this shape:
{"covenants":[{"type":"DSCR|LTV|AGING|RESERVE|OTHER","threshold":number,"cadence":"daily|weekly|monthly|quarterly","sourceQuote":"verbatim clause","confidence":0-1}]}
Use DSCR for debt service coverage ratios, AGING for receivables aging day limits, LTV for loan-to-value, RESERVE for liquidity/reserve requirements.
Include the exact source sentence in sourceQuote.`;

export class ClaudeExtractionProvider implements CovenantExtractionProvider {
  readonly name = "claude" as const;
  private readonly client: Anthropic;

  constructor(apiKey: string, private readonly model = "claude-3-5-haiku-20241022") {
    this.client = new Anthropic({ apiKey });
  }

  async extract(input: LlmExtractionInput): Promise<ExtractedCovenant[]> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Filename: ${input.filename}\n\nDocument text:\n${input.text.slice(0, 120_000)}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude returned no text content");
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude response did not contain JSON");
    }

    const parsed = extractionResponseSchema.parse(JSON.parse(jsonMatch[0]));
    return parsed.covenants;
  }
}
