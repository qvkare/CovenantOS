import { describe, expect, it } from "vitest";
import {
  formatPaymentHeader,
  normalizeAccountHash,
  parsePaymentHeader,
  toPaymentAddress,
} from "@covenantos/shared";

describe("x402 payment header", () => {
  it("formats and parses Casper native payment headers", () => {
    const accountHash = "533109d2891f6c3a293be1bc88ad38965301dd8211b455e7850d1fc2268bce83";
    const header = formatPaymentHeader({
      payeeAccountHash: accountHash,
      amountMotes: 1_000_000n,
      transactionHash: "abc123",
    });

    expect(header).toBe(
      `casper:${toPaymentAddress(accountHash)}:1000000:abc123`,
    );

    const parsed = parsePaymentHeader(header);
    expect(parsed.network).toBe("casper");
    expect(parsed.amountMotes).toBe(1_000_000n);
    expect(parsed.transactionHash).toBe("abc123");
    expect(normalizeAccountHash(parsed.payeeAccountHash)).toBe(accountHash);
  });
});
