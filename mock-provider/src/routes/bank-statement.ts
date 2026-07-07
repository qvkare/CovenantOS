import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";

const PAYMENT_ADDRESS = process.env.X402_PAYMENT_ADDRESS ?? "01mockprovider000000000000000000000000000000";
const PAYMENT_AMOUNT = process.env.X402_PAYMENT_AMOUNT_MOTES ?? "1000000";

export async function registerBankStatementRoute(app: FastifyInstance) {
  app.get("/api/v1/bank-statement", async (request, reply) => {
    const paymentHeader = request.headers["x-payment"];

    if (!paymentHeader || typeof paymentHeader !== "string") {
      return reply
        .status(402)
        .headers({
          "X-Payment-Address": PAYMENT_ADDRESS,
          "X-Payment-Amount": PAYMENT_AMOUNT,
          "X-Payment-Network": "casper",
        })
        .send({
          error: "payment_required",
          message: "x402 payment required for bank statement access",
        });
    }

    if (!paymentHeader.startsWith("casper:")) {
      return reply.status(400).send({ error: "invalid_payment_header" });
    }

    const query = request.query as { scenario?: string };
    const scenario = query.scenario ?? "healthy";
    const payload =
      scenario === "breach"
        ? {
            sourceId: "mock-bank-statement",
            dscr: 0.82,
            cashBalance: 120000,
            asOf: new Date().toISOString(),
          }
        : {
            sourceId: "mock-bank-statement",
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
