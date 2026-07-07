export const LOG_REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers['x-demo-reset-token']",
  "req.headers['x-payment']",
  "CASPER_SECRET_KEY_HEX",
  "ANTHROPIC_API_KEY",
  "CSPR_CLOUD_AUTH_TOKEN",
  "rawPayload",
  "*.rawPayload",
  "*.x402PaymentRef",
];

export function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 120 && /^[0-9a-f]+$/i.test(value)) {
      return `${value.slice(0, 8)}…redacted`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForLog);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(record)) {
      if (/secret|password|token|apikey|private/i.test(key)) {
        out[key] = "[redacted]";
      } else if (key === "rawPayload") {
        out[key] = { redacted: true, keys: Object.keys(nested as object) };
      } else {
        out[key] = sanitizeForLog(nested);
      }
    }
    return out;
  }
  return value;
}
