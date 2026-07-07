import type { FastifyInstance } from "fastify";
import { isDatabaseEnabled } from "../db/index.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const indexer = app.indexer?.getStatus();

    return {
      status: "ok",
      service: "covenantos-backend",
      phase: 8,
      database: isDatabaseEnabled(),
      indexer: indexer ?? { enabled: false, mode: "local-only", connected: false },
      events: {
        stream: "/events/stream",
        history: "/events",
      },
    };
  });
}
