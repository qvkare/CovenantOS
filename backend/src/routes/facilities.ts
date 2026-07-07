import type { FastifyInstance } from "fastify";

export async function registerFacilityRoutes(app: FastifyInstance) {
  app.post("/facilities", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "Facility creation will be wired in Phase 3 (chain service).",
    });
  });

  app.post("/facilities/:id/documents", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "Document upload will be wired in Phase 4 (Document Agent).",
    });
  });

  app.get("/facilities/:id/covenants", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "Covenant listing will be wired in Phase 4.",
    });
  });

  app.post("/facilities/:id/check", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "Manual covenant check will be wired in Phase 6.",
    });
  });

  app.get("/facilities/:id/audit", async (_request, reply) => {
    return reply.status(501).send({
      error: "Not implemented",
      message: "Audit trail will be wired in Phase 6.",
    });
  });
}
