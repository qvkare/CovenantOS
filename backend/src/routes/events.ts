import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ChainEvent } from "@covenantos/shared";
import { eventBus } from "../events/bus.js";
import { queryChainEvents } from "../db/index.js";

const SSE_CLIENTS = new Set<FastifyReply>();

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

  app.get("/events/stream", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
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
