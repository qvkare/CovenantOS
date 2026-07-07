export function truncateHash(value: string, head = 6, tail = 4): string {
  if (!value) return "";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function truncateAddress(value: string, chars = 4): string {
  if (!value) return "";
  const normalized = value.startsWith("0x") ? value : value;
  if (normalized.length <= chars * 2 + 3) return normalized;
  return `${normalized.slice(0, chars + (normalized.startsWith("0x") ? 2 : 0))}…${normalized.slice(-chars)}`;
}

export function formatMotes(
  motes: bigint | string | number,
  fractionDigits = 4,
): string {
  const bi = typeof motes === "bigint" ? motes : BigInt(motes);
  const cspr = Number(bi) / 1_000_000_000;
  return cspr.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatTimestamp(ts: string | number | Date): string {
  const date = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatRelative(ts: string | number | Date): string {
  const date = ts instanceof Date ? ts : new Date(ts);
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "second") {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return "just now";
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
