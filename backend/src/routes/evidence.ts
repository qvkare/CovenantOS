import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { getDemoStore } from "@covenantos/shared";
import { CovenantAgent } from "../agents/covenant-agent.js";
import { X402Gateway } from "../x402/index.js";
import { evidenceBodySchema, parseBody } from "./schemas.js";

let gateway: X402Gateway | undefined;
let covenantAgent: CovenantAgent | undefined;

function getGateway(): X402Gateway {
  if (!gateway) {
    gateway = new X402Gateway();
  }
  return gateway;
}

function getCovenantAgent(): CovenantAgent {
  if (!covenantAgent) {
    covenantAgent = new CovenantAgent();
  }
  return covenantAgent;
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

    const body = (() => {
      try {
        return parseBody(evidenceBodySchema, request.body);
      } catch (error) {
        if (error instanceof ZodError) {
          reply.status(400).send({ error: "Invalid request body", details: error.flatten() });
          return null;
        }
        throw error;
      }
    })();

    if (!body) return;

    const scenario = body.scenario ?? "healthy";

    try {
      const fetchResult = await getGateway().fetchBankStatement(scenario, id);
      const check = await getCovenantAgent().ingestFetchResult(id, fetchResult);

      return reply.send({
        evidence: fetchResult.data,
        payment: fetchResult.payment,
        transactionHash: fetchResult.transactionHash,
        covenantCheck: check,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evidence fetch failed";
      return reply.status(502).send({ error: message });
    }
  });
}
