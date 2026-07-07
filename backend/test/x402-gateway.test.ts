import { describe, expect, it } from "vitest";
import { X402Gateway } from "../src/x402/gateway.js";

describe("X402Gateway", () => {
  it("tracks budget cap locally", async () => {
    const gateway = new X402Gateway(
      {
        PROVIDER_URL: "http://localhost:3002",
        X402_PAYMENT_AMOUNT_MOTES: 1_000_000n,
        X402_BUDGET_CAP_MOTES: 5_000_000n,
        CASPER_NODE_URL: "https://node.testnet.casper.network/rpc",
        CASPER_CHAIN_NAME: "casper-test",
      },
      {
        fetchPaidJson: async () => ({
          transactionHash: "abc",
          data: {
            sourceId: "bank-statement",
            payload: { dscr: 1.4 },
            payloadHash: "hash",
          },
          payment: {
            id: "pay-1",
            provider: "localhost",
            amountMotes: "1000000",
            budgetRemainingMotes: "0",
            requestHash: "req",
            responseHash: "hash",
            createdAt: new Date().toISOString(),
          },
        }),
      } as never,
      5_000_000n,
    );

    await gateway.fetchBankStatement("healthy", "fac-1");
    expect(gateway.getBudgetRemainingMotes()).toBe(4_000_000n);
  });
});
