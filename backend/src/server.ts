import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerHealthRoutes } from "./routes/health.js";
import { registerFacilityRoutes } from "./routes/facilities.js";
import { registerActionRoutes } from "./routes/actions.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerChainRoutes } from "./routes/chain.js";
import { registerEvidenceRoutes } from "./routes/evidence.js";
import type { ChainIndexer } from "./indexer/index.js";

export type BuildServerOptions = {
  indexer?: ChainIndexer;
};

export async function buildServer(options: BuildServerOptions = {}) {
  const app = Fastify({
    logger: true,
  });

  app.decorate("indexer", options.indexer);

  await app.register(cors, { origin: true });

  await registerHealthRoutes(app);
  await registerFacilityRoutes(app);
  await registerActionRoutes(app);
  await registerEventRoutes(app);
  await registerChainRoutes(app);
  await registerEvidenceRoutes(app);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    indexer?: ChainIndexer;
  }
}
