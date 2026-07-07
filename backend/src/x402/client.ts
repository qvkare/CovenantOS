import { createHash, randomUUID } from "node:crypto";
import type { EvidenceProviderResponse, X402PaymentRecord } from "@covenantos/shared";
import { formatPaymentHeader, parsePaymentHeader, toPaymentAddress } from "@covenantos/shared";
import {
  AccountHash,
  HttpHandler,
  NativeTransferBuilder,
  RpcClient,
  Timestamp,
} from "../chain/casper-sdk.js";
import { loadPrivateKeyFromEnv } from "../chain/signer.js";
import type { X402Env } from "./config.js";

export type PaidFetchResult = {
  data: EvidenceProviderResponse;
  payment: X402PaymentRecord;
  transactionHash: string;
};

export class X402PaymentClient {
  private readonly rpc: InstanceType<typeof RpcClient>;
  private readonly privateKey = loadPrivateKeyFromEnv();

  constructor(private readonly env: X402Env) {
    this.rpc = new RpcClient(new HttpHandler(env.CASPER_NODE_URL));
  }

  async fetchPaidJson(path: string, query?: Record<string, string>): Promise<PaidFetchResult> {
    const url = new URL(path, this.env.PROVIDER_URL);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }

    const initial = await fetch(url, { method: "GET" });
    if (initial.status !== 402) {
      const body = await initial.text();
      throw new Error(`Expected HTTP 402 from provider, got ${initial.status}: ${body}`);
    }

    const payeeHeader = initial.headers.get("x-payment-address");
    const amountHeader = initial.headers.get("x-payment-amount");
    const networkHeader = initial.headers.get("x-payment-network");

    if (!payeeHeader || !amountHeader || networkHeader !== "casper") {
      throw new Error("Provider returned invalid x402 payment headers");
    }

    const amountMotes = BigInt(amountHeader);
    const transactionHash = await this.submitNativeTransfer(payeeHeader, amountMotes);
    const paymentHeader = formatPaymentHeader({
      payeeAccountHash: payeeHeader,
      amountMotes,
      transactionHash,
    });

    const paid = await fetch(url, {
      method: "GET",
      headers: { "X-Payment": paymentHeader },
    });

    if (!paid.ok) {
      const body = await paid.text();
      throw new Error(`Paid provider request failed (${paid.status}): ${body}`);
    }

    const payload = (await paid.json()) as Record<string, unknown>;
    const payloadHash =
      typeof payload.payloadHash === "string"
        ? payload.payloadHash
        : createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const requestHash = createHash("sha256").update(url.toString()).digest("hex");

    return {
      transactionHash,
      data: {
        sourceId: String(payload.sourceId ?? "bank-statement"),
        payload,
        payloadHash,
      },
      payment: {
        id: randomUUID(),
        provider: new URL(this.env.PROVIDER_URL).host,
        amountMotes: amountMotes.toString(),
        budgetRemainingMotes: "0",
        requestHash,
        responseHash: payloadHash,
        createdAt: new Date().toISOString(),
      },
    };
  }

  private async submitNativeTransfer(
    payeeAccountHash: string,
    amountMotes: bigint,
  ): Promise<string> {
    const sender = this.privateKey.publicKey;
    const target = AccountHash.fromString(toPaymentAddress(payeeAccountHash));

    const transaction = new NativeTransferBuilder()
      .from(sender)
      .targetAccountHash(target)
      .amount(amountMotes.toString())
      .id(Date.now())
      .chainName(this.env.CASPER_CHAIN_NAME)
      .payment(100_000_000)
      .timestamp(new Timestamp(new Date()))
      .build();

    transaction.sign(this.privateKey);

    const result = await this.rpc.putTransaction(transaction);
    const hash = result.transactionHash.toHex();

    await this.rpc.waitForTransaction(transaction, 120_000);

    const parsed = parsePaymentHeader(
      formatPaymentHeader({
        payeeAccountHash,
        amountMotes,
        transactionHash: hash,
      }),
    );

    return parsed.transactionHash;
  }
}
