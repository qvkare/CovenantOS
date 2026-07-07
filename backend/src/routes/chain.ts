import type { FastifyInstance } from "fastify";
import { ChainService } from "../chain/index.js";
import { ensureChainDemoReady } from "../chain/bootstrap.js";
import { ChainWriter } from "../chain/writer.js";

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

  app.post("/chain/bootstrap", async (_request, reply) => {
    const writer = new ChainWriter();
    if (!writer.canWriteOnChain()) {
      return reply.status(503).send({ error: "Signer or contracts not configured" });
    }

    try {
      await ensureChainDemoReady(writer);
      return reply.send({ ok: true, message: "Chain demo bootstrap completed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bootstrap failed";
      return reply.status(422).send({ error: message });
    }
  });
}
