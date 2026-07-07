import type { FastifyInstance } from "fastify";

export async function registerActionRoutes(app: FastifyInstance) {
  app.get("/actions", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "Approval queue will be wired in Phase 6.",
    });
  });

  app.post("/actions/:id/approve", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "Officer approval will be wired in Phase 6.",
    });
  });
}
