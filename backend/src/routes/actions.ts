import type { FastifyInstance } from "fastify";
import { getDemoStore } from "@covenantos/shared";

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
    return reply.send({ action });
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
