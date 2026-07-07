import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ChainEvent } from "@covenantos/shared";
import { getDemoStore } from "@covenantos/shared";

const SSE_CLIENTS = new Set<FastifyReply>();

function broadcast(event: ChainEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of SSE_CLIENTS) {
    void client.raw.write(payload);
  }
}

getDemoStore().subscribe(broadcast);

export async function registerEventRoutes(app: FastifyInstance) {
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
