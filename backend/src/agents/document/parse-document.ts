import { parse as parseCsv } from "csv-parse/sync";

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv"]);

function extension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

async function parsePdfWithPdfJs(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true })
    .promise;

  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }

  return pages.join("\n\n");
}

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const { default: pdfParse } = await import("pdf-parse");
    const result = await pdfParse(buffer);
    if (result.text.trim()) return result.text;
  } catch {
    // pdf-parse rejects some valid PDFs (e.g. non-linearized XRef tables).
  }

  return parsePdfWithPdfJs(buffer);
}

function parseCsvDocument(buffer: Buffer): string {
  const rows = parseCsv(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (rows.length === 0) {
    return buffer.toString("utf8");
  }

  return rows
    .map((row, index) => {
      const parts = Object.entries(row).map(([key, value]) => `${key}: ${value}`);
      return `Row ${index + 1}\n${parts.join("\n")}`;
    })
    .join("\n\n");
}

export async function parseDocument(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = extension(filename);

  if (ext === ".pdf") {
    return parsePdf(buffer);
  }

  if (ext === ".csv") {
    return parseCsvDocument(buffer);
  }

  if (TEXT_EXTENSIONS.has(ext) || ext === "") {
    return buffer.toString("utf8");
  }

  throw new Error(`Unsupported document type: ${ext || "unknown"}`);
}
