import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import {
  paymentRequiredHeaders,
  resolveExpectedPayeeAccountHash,
  verifyX402Payment,
} from "../x402/verify-payment.js";

const PAYMENT_AMOUNT = BigInt(process.env.X402_PAYMENT_AMOUNT_MOTES ?? "1000000");
const NODE_URL = process.env.CASPER_NODE_URL ?? "https://node.testnet.casper.network/rpc";

export async function registerBankStatementRoute(app: FastifyInstance) {
  const payeeAccountHash = resolveExpectedPayeeAccountHash(process.env);

  app.get("/api/v1/bank-statement", async (request, reply) => {
    const paymentHeader = request.headers["x-payment"];

    if (!paymentHeader || typeof paymentHeader !== "string") {
      return reply
        .status(402)
        .headers(paymentRequiredHeaders(payeeAccountHash, PAYMENT_AMOUNT))
        .send({
          error: "payment_required",
          message: "x402 payment required for bank statement access",
        });
    }

    try {
      await verifyX402Payment({
        paymentHeader,
        expectedPayeeAccountHash: payeeAccountHash,
        expectedAmountMotes: PAYMENT_AMOUNT,
        nodeUrl: NODE_URL,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid_payment";
      return reply.status(402).send({ error: "payment_verification_failed", message });
    }

    const query = request.query as { scenario?: string };
    const scenario = query.scenario ?? "healthy";
    const payload =
      scenario === "breach"
        ? {
            sourceId: "bank-statement",
            dscr: 0.82,
            cashBalance: 120000,
            asOf: new Date().toISOString(),
          }
        : {
            sourceId: "bank-statement",
            dscr: 1.45,
            cashBalance: 540000,
            asOf: new Date().toISOString(),
          };

    const payloadHash = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    return reply.send({
      ...payload,
      payloadHash,
      x402PaymentRef: paymentHeader,
    });
  });
}
