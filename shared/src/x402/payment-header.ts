export type ParsedX402Payment = {
  network: "casper";
  payeeAccountHash: string;
  amountMotes: bigint;
  transactionHash: string;
};

export function normalizeAccountHash(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("account-hash-")) {
    return trimmed.slice("account-hash-".length);
  }
  if (trimmed.startsWith("00") && trimmed.length === 66) {
    return trimmed.slice(2);
  }
  if (trimmed.startsWith("01") && trimmed.length === 66) {
    return trimmed.slice(2);
  }
  return trimmed;
}

export function toPaymentAddress(accountHash: string): string {
  const normalized = normalizeAccountHash(accountHash);
  return `01${normalized}`;
}

export function formatPaymentHeader(payment: {
  payeeAccountHash: string;
  amountMotes: bigint | string;
  transactionHash: string;
}): string {
  const payee = toPaymentAddress(payment.payeeAccountHash);
  const amount = payment.amountMotes.toString();
  const hash = payment.transactionHash.replace(/^0x/i, "");
  return `casper:${payee}:${amount}:${hash}`;
}

export function parsePaymentHeader(header: string): ParsedX402Payment {
  const parts = header.trim().split(":");
  if (parts.length !== 4 || parts[0] !== "casper") {
    throw new Error("Invalid X-Payment header format");
  }

  const [, payee, amount, transactionHash] = parts;
  if (!payee || !amount || !transactionHash) {
    throw new Error("Invalid X-Payment header format");
  }

  if (!/^\d+$/.test(amount)) {
    throw new Error("Invalid payment amount in X-Payment header");
  }

  return {
    network: "casper",
    payeeAccountHash: normalizeAccountHash(payee),
    amountMotes: BigInt(amount),
    transactionHash: transactionHash.toLowerCase(),
  };
}
