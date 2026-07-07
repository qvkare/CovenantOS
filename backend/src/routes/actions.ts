import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { getAppStore } from "../store/persisting-store.js";
import { TreasuryAgent } from "../agents/treasury-agent.js";
import { ChainWriter } from "../chain/writer.js";
import { approveActionSchema, parseBody } from "./schemas.js";

const treasuryAgent = new TreasuryAgent();
const chainWriter = new ChainWriter();

function validationError(error: unknown) {
  if (error instanceof ZodError) {
    return { statusCode: 400, body: { error: "Invalid request body", details: error.flatten() } };
  }
  return null;
}

export async function registerActionRoutes(app: FastifyInstance) {
  app.get("/actions", async (request, reply) => {
    const status = (request.query as { status?: string }).status;
    const actions = getAppStore().listActions(status);
    return reply.send({ actions });
  });

  app.post("/actions/:id/approve", async (request, reply) => {
    const { id } = request.params as { id: string };

    let body;
    try {
      body = parseBody(approveActionSchema, request.body);
    } catch (error) {
      const invalid = validationError(error);
      if (invalid) return reply.status(invalid.statusCode).send(invalid.body);
      throw error;
    }

    const pending = getAppStore().getAction(id);
    if (!pending || pending.status === "executed" || pending.status === "rejected") {
      return reply.status(404).send({ error: "Action not found or not pending" });
    }

    let onchainApproveTx: string | undefined;
    if (pending.onchainActionId && chainWriter.canWriteOnChain()) {
      try {
        onchainApproveTx = await chainWriter.approveAction(pending.onchainActionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "On-chain approval failed";
        return reply.status(422).send({ error: message, action: pending });
      }
    }

    const action = getAppStore().approveAction(id, {
      approver: body.approver,
      txHash: onchainApproveTx ?? body.txHash,
    });
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
    const action = getAppStore().rejectAction(id);
    if (!action) {
      return reply.status(404).send({ error: "Action not found" });
    }
    return reply.send({ action });
  });
}
