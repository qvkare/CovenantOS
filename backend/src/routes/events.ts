import type { FastifyInstance } from "fastify";

export async function registerEventRoutes(app: FastifyInstance) {
  app.get("/events/stream", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "SSE stream will be wired in Phase 7 (indexer).",
    });
  });
}
