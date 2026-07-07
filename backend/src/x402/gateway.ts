import { createHash, randomUUID } from "node:crypto";
import type { EvidenceProviderResponse, X402PaymentRecord } from "@covenantos/shared";
import {
  assertCounterpartyAllowed,
  assertSpendWithinLimit,
  assertToolAllowed,
} from "../policy/enforce-policy.js";
import { X402PaymentClient } from "./client.js";
import { loadX402Env, type X402Env } from "./config.js";

export type EvidenceFetchResult = {
  data: EvidenceProviderResponse;
  payment: X402PaymentRecord;
  transactionHash: string;
};

export class X402Gateway {
  private budgetRemaining: bigint;
  private readonly payments: X402PaymentRecord[] = [];
  private readonly env: X402Env;
  private readonly client: X402PaymentClient;

  constructor(
    env: X402Env = loadX402Env(),
    client?: X402PaymentClient,
    initialBudget?: bigint,
  ) {
    this.env = env;
    this.client = client ?? new X402PaymentClient(env);
    this.budgetRemaining = initialBudget ?? env.X402_BUDGET_CAP_MOTES;
  }

  getBudgetRemainingMotes(): bigint {
    return this.budgetRemaining;
  }

  listPayments(): X402PaymentRecord[] {
    return [...this.payments];
  }

  async fetchBankStatement(
    scenario: "healthy" | "breach" = "healthy",
    facilityId?: string,
  ): Promise<EvidenceFetchResult> {
    assertCounterpartyAllowed("covenantos-provider");
    assertToolAllowed("x402:bank-statement");

    const amount = this.env.X402_PAYMENT_AMOUNT_MOTES;
    assertSpendWithinLimit(amount);

    if (amount > this.budgetRemaining) {
      throw new Error("x402 budget cap exceeded for this facility run");
    }

    const result = await this.client.fetchPaidJson("/api/v1/bank-statement", { scenario });
    this.budgetRemaining -= amount;

    const payment: X402PaymentRecord = {
      ...result.payment,
      facilityId,
      amountMotes: amount.toString(),
      budgetRemainingMotes: this.budgetRemaining.toString(),
      requestHash: createHash("sha256")
        .update(`bank-statement:${scenario}:${facilityId ?? "none"}`)
        .digest("hex"),
      id: randomUUID(),
    };

    this.payments.push(payment);

    return {
      data: result.data,
      payment,
      transactionHash: result.transactionHash,
    };
  }
}

export { loadX402Env } from "./config.js";
export { X402PaymentClient } from "./client.js";
