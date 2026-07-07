import type { FastifyInstance } from "fastify";
import { getDemoStore } from "@covenantos/shared";
import { X402Gateway } from "../x402/index.js";

let gateway: X402Gateway | undefined;

function getGateway(): X402Gateway {
  if (!gateway) {
    gateway = new X402Gateway();
  }
  return gateway;
}

export async function registerEvidenceRoutes(app: FastifyInstance) {
  app.get("/x402/budget", async (_request, reply) => {
    const active = getGateway();
    return reply.send({
      budgetRemainingMotes: active.getBudgetRemainingMotes().toString(),
      payments: active.listPayments(),
    });
  });

  app.post("/facilities/:id/evidence", async (request, reply) => {
    const { id } = request.params as { id: string };
    const facility = getDemoStore().getFacility(id);
    if (!facility) {
      return reply.status(404).send({ error: "Facility not found" });
    }

    const body = (request.body ?? {}) as { scenario?: "healthy" | "breach" };
    const scenario = body.scenario ?? "healthy";

    try {
      const result = await getGateway().fetchBankStatement(scenario, id);
      return reply.send({
        evidence: result.data,
        payment: result.payment,
        transactionHash: result.transactionHash,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evidence fetch failed";
      return reply.status(502).send({ error: message });
    }
  });
}
