import type { FastifyInstance } from "fastify";
import { getDemoStore } from "@covenantos/shared";
import { TreasuryAgent } from "../agents/treasury-agent.js";

const treasuryAgent = new TreasuryAgent();

export async function registerActionRoutes(app: FastifyInstance) {
  app.get("/actions", async (request, reply) => {
    const status = (request.query as { status?: string }).status;
    const actions = getDemoStore().listActions(status);
    return reply.send({ actions });
  });

  app.post("/actions/:id/approve", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { approver: string; txHash?: string };
    if (!body?.approver) {
      return reply.status(400).send({ error: "approver is required" });
    }

    const action = getDemoStore().approveAction(id, body);
    if (!action) {
      return reply.status(404).send({ error: "Action not found or not pending" });
    }

    let execution;
    if (action.status === "executable") {
      try {
        execution = await treasuryAgent.execute(id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Execution failed";
        return reply.status(422).send({ error: message, action });
      }
    }

    return reply.send({
      action: execution?.action ?? action,
      execution: execution ?? undefined,
    });
  });

  app.post("/actions/:id/execute", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const execution = await treasuryAgent.execute(id);
      if (!execution) {
        return reply.status(404).send({ error: "Action not found or not executable" });
      }
      return reply.send(execution);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed";
      return reply.status(422).send({ error: message });
    }
  });

  app.post("/actions/:id/reject", async (request, reply) => {
    const { id } = request.params as { id: string };
    const action = getDemoStore().rejectAction(id);
    if (!action) {
      return reply.status(404).send({ error: "Action not found" });
    }
    return reply.send({ action });
  });
}
