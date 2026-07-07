import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import { getDemoStore } from "@covenantos/shared";
import { DocumentAgent } from "../agents/document-agent.js";

const documentAgent = new DocumentAgent();

async function extractFromUpload(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file();
  if (!file) {
    return reply.status(400).send({ error: "Missing file upload" });
  }

  const buffer = await file.toBuffer();

  try {
    const result = await documentAgent.extractFromUpload(buffer, file.filename);
    return reply.send({
      documentId: result.documentId,
      covenants: result.covenants,
      provider: result.provider,
      warnings: result.warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed";
    return reply.status(422).send({ error: message });
  }
}

export async function registerFacilityRoutes(app: FastifyInstance) {
  await app.register(multipart);

  app.get("/facilities", async (_request, reply) => {
    const store = getDemoStore();
    return reply.send({ facilities: store.listFacilities() });
  });

  app.get("/facilities/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getDemoStore().getFacility(id);
    if (!detail) {
      return reply.status(404).send({ error: "Facility not found" });
    }
    return reply.send(detail);
  });

  app.get("/facilities/:id/covenants", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getDemoStore().getFacility(id);
    if (!detail) {
      return reply.status(404).send({ error: "Facility not found" });
    }
    return reply.send({ covenants: getDemoStore().getCovenants(id) });
  });

  app.get("/facilities/:id/audit", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getDemoStore().getFacility(id);
    if (!detail) {
      return reply.status(404).send({ error: "Facility not found" });
    }
    return reply.send({ entries: getDemoStore().getAudit(id) });
  });

  app.post("/facilities/:id/check", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = getDemoStore().checkFacility(id);
    if (!result) {
      return reply.status(404).send({ error: "Facility not found" });
    }
    return reply.send(result);
  });

  app.post("/facilities/extract", extractFromUpload);

  app.post("/facilities", async (request, reply) => {
    const body = request.body as {
      name: string;
      issuer: string;
      covenants: unknown[];
    };
    if (!body?.name || !body?.issuer || !Array.isArray(body.covenants)) {
      return reply.status(400).send({ error: "Invalid facility payload" });
    }
    const result = getDemoStore().registerFacility({
      name: body.name,
      issuer: body.issuer,
      covenants: body.covenants as Parameters<
        ReturnType<typeof getDemoStore>["registerFacility"]
      >[0]["covenants"],
    });
    return reply.send(result);
  });

  app.put("/covenants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = request.body as Record<string, unknown>;
    const updated = getDemoStore().updateCovenant(id, patch);
    if (!updated) {
      return reply.status(404).send({ error: "Covenant not found" });
    }
    return reply.send({ covenant: updated });
  });

  app.post("/facilities/:id/documents", extractFromUpload);
}
