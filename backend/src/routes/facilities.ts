import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import { ZodError } from "zod";
import { DEMO_FACILITY_IDS } from "@covenantos/shared";
import { getAppStore } from "../store/persisting-store.js";
import { DocumentAgent } from "../agents/document-agent.js";
import { CovenantAgent } from "../agents/covenant-agent.js";
import { X402Gateway } from "../x402/index.js";
import { checkBodySchema, parseBody, registerFacilitySchema } from "./schemas.js";

const documentAgent = new DocumentAgent();
const covenantAgent = new CovenantAgent();
let gateway: X402Gateway | undefined;

function getGateway(): X402Gateway {
  if (!gateway) {
    gateway = new X402Gateway();
  }
  return gateway;
}

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
    const store = getAppStore();
    return reply.send({ facilities: store.listFacilities() });
  });

  app.get("/facilities/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getAppStore().getFacility(id);
    if (!detail) {
      return reply.status(404).send({ error: "Facility not found" });
    }
    return reply.send(detail);
  });

  app.get("/facilities/:id/covenants", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getAppStore().getFacility(id);
    if (!detail) {
      return reply.status(404).send({ error: "Facility not found" });
    }
    return reply.send({ covenants: getAppStore().getCovenants(id) });
  });

  app.get("/facilities/:id/audit", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getAppStore().getFacility(id);
    if (!detail) {
      return reply.status(404).send({ error: "Facility not found" });
    }
    return reply.send({ entries: getAppStore().getAudit(id) });
  });

  app.post("/facilities/:id/check", async (request, reply) => {
    const { id } = request.params as { id: string };

    let body;
    try {
      body = parseBody(checkBodySchema, request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: "Invalid request body", details: error.flatten() });
      }
      throw error;
    }

    const facility = getAppStore().getFacility(id);
    if (!facility) {
      return reply.status(404).send({ error: "Facility not found" });
    }

    const fetchEvidence = body.fetchEvidence !== false;
    if (fetchEvidence) {
      const scenario =
        body.scenario ??
        (id === DEMO_FACILITY_IDS.breach ? "breach" : "healthy");

      try {
        const fetchResult = await getGateway().fetchBankStatement(scenario, id);
        const result = await covenantAgent.ingestFetchResult(id, fetchResult);
        return reply.send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Covenant check failed";
        return reply.status(502).send({ error: message });
      }
    }

    const result = covenantAgent.runCheck(id);
    return reply.send(result);
  });

  app.post("/facilities/extract", extractFromUpload);

  app.post("/facilities", async (request, reply) => {
    let body;
    try {
      body = parseBody(registerFacilitySchema, request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: "Invalid facility payload", details: error.flatten() });
      }
      throw error;
    }

    const result = getAppStore().registerFacility({
      name: body.name,
      issuer: body.issuer,
      covenants: body.covenants as unknown as Parameters<
        ReturnType<typeof getAppStore>["registerFacility"]
      >[0]["covenants"],
    });
    return reply.send(result);
  });

  app.put("/covenants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = request.body as Record<string, unknown>;
    const updated = getAppStore().updateCovenant(id, patch);
    if (!updated) {
      return reply.status(404).send({ error: "Covenant not found" });
    }
    return reply.send({ covenant: updated });
  });

  app.post("/facilities/:id/documents", extractFromUpload);
}
