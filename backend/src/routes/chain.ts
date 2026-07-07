import type { FastifyInstance } from "fastify";
import { ChainService } from "../chain/index.js";

export async function registerChainRoutes(app: FastifyInstance) {
  app.get("/chain/status", async (_request, reply) => {
    try {
      const status = await ChainService.instance().status();
      return reply.send(status);
    } catch (error) {
      app.log.error(error);
      return reply.status(503).send({
        error: "ChainUnavailable",
        message: error instanceof Error ? error.message : "Chain status unavailable",
      });
    }
  });
}
