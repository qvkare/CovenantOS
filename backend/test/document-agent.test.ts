import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DocumentAgent } from "../src/agents/document-agent.js";
import { HeuristicExtractionProvider } from "../src/agents/document/providers/heuristic.js";
import { validateExtractedCovenants } from "../src/agents/document/validate-covenants.js";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
);

describe("DocumentAgent", () => {
  it("extracts golden-file covenants from sample facility agreement", async () => {
    const text = fs.readFileSync(
      path.join(fixturesDir, "northwind-facility-agreement.txt"),
      "utf8",
    );
    const expected = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, "expected-covenants.json"), "utf8"),
    ) as Array<{
      type: string;
      threshold: number;
      cadence: string;
      sourceQuote: string;
    }>;

    const agent = new DocumentAgent(new HeuristicExtractionProvider());
    const result = await agent.extractFromText({
      text,
      filename: "northwind-facility-agreement.txt",
    });

    expect(result.provider).toBe("heuristic");
    expect(result.covenants.length).toBeGreaterThanOrEqual(expected.length);

    for (const fixture of expected) {
      const covenant = result.covenants.find((item) => item.type === fixture.type);
      expect(covenant).toBeDefined();
      expect(covenant!.threshold).toBe(fixture.threshold);
      expect(covenant!.cadence).toBe(fixture.cadence);
      expect(covenant!.sourceQuote.toLowerCase()).toContain(
        fixture.sourceQuote.toLowerCase(),
      );
    }

    const aging = result.covenants.find((c) => c.type === "AGING");
    expect(aging?.humanVerified).toBe(false);
    expect(aging?.confidence).toBeLessThan(0.85);

    const dscr = result.covenants.find((c) => c.type === "DSCR");
    expect(dscr?.humanVerified).toBe(true);
  });

  it("flags low-confidence covenants for human review", () => {
    const validated = validateExtractedCovenants([
      {
        type: "AGING",
        threshold: 45,
        cadence: "weekly",
        sourceQuote: "Receivables aged in excess of forty-five (45) days",
        confidence: 0.8,
      },
    ]);

    expect(validated[0]?.needsHumanReview).toBe(true);
  });

  it("extracts covenants from uploaded fixture bytes", async () => {
    const buffer = fs.readFileSync(
      path.join(fixturesDir, "northwind-facility-agreement.txt"),
    );
    const agent = new DocumentAgent(new HeuristicExtractionProvider());
    const result = await agent.extractFromUpload(buffer, "northwind-facility-agreement.txt");

    expect(result.covenants.length).toBeGreaterThanOrEqual(2);
    expect(result.documentId).toMatch(/^doc-/);
  });
});
