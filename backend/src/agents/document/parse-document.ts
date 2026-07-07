import { parse as parseCsv } from "csv-parse/sync";

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv"]);

function extension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const { default: pdfParse } = await import("pdf-parse");
  const result = await pdfParse(buffer);
  return result.text;
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
