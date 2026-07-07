import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ChainEvent } from "@covenantos/shared";
import { eventBus } from "../events/bus.js";
import { queryChainEvents } from "../db/index.js";

const SSE_CLIENTS = new Set<FastifyReply>();

const ALLOWED_SSE_ORIGINS = new Set([
  "https://covenantos.xyz",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function sseCorsHeaders(origin: string | undefined): Record<string, string> {
  if (origin && ALLOWED_SSE_ORIGINS.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    };
  }
  return {};
}

function broadcast(event: ChainEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of SSE_CLIENTS) {
    void client.raw.write(payload);
  }
}

eventBus.subscribe(broadcast);

export async function registerEventRoutes(app: FastifyInstance) {
  app.get("/events", async (request, reply) => {
    const query = request.query as {
      limit?: string;
      facilityId?: string;
      since?: string;
    };

    const events = await queryChainEvents({
      limit: query.limit ? Number(query.limit) : 50,
      facilityId: query.facilityId,
      since: query.since,
    });

    return reply.send({ events });
  });

  app.options("/events/stream", async (request, reply) => {
    const origin = request.headers.origin;
    return reply
      .headers(sseCorsHeaders(origin))
      .header("Access-Control-Allow-Methods", "GET, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type")
      .status(204)
      .send();
  });

  app.get("/events/stream", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...sseCorsHeaders(request.headers.origin),
    });

    SSE_CLIENTS.add(reply);

    const keepAlive = setInterval(() => {
      reply.raw.write(": keepalive\n\n");
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(keepAlive);
      SSE_CLIENTS.delete(reply);
    });

    reply.raw.write(": connected\n\n");
  });
}
