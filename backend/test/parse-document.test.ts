import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDocument } from "../src/agents/document/parse-document.js";

const samplesDir = join(dirname(fileURLToPath(import.meta.url)), "../../demo/samples");

describe("parseDocument", () => {
  it("extracts text from the demo facility agreement PDF", async () => {
    const buffer = readFileSync(join(samplesDir, "atlas-receivables-facility-agreement.pdf"));
    const text = await parseDocument(buffer, "atlas-receivables-facility-agreement.pdf");

    expect(text).toContain("Debt Service Coverage");
    expect(text).toContain("Atlas Receivables");
  });
});
