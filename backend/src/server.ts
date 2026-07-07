import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { registerHealthRoutes } from "./routes/health.js";
import { registerFacilityRoutes } from "./routes/facilities.js";
import { registerActionRoutes } from "./routes/actions.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerChainRoutes } from "./routes/chain.js";
import { registerEvidenceRoutes } from "./routes/evidence.js";
import { registerDemoRoutes } from "./routes/demo.js";
import type { ChainIndexer } from "./indexer/index.js";
import { LOG_REDACT_PATHS } from "./security/sanitize-log.js";

export type BuildServerOptions = {
  indexer?: ChainIndexer;
};

export async function buildServer(options: BuildServerOptions = {}) {
  const app = Fastify({
    logger: {
      redact: LOG_REDACT_PATHS,
    },
  });

  app.decorate("indexer", options.indexer);

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  await registerHealthRoutes(app);
  await registerFacilityRoutes(app);
  await registerActionRoutes(app);
  await registerEventRoutes(app);
  await registerChainRoutes(app);
  await registerEvidenceRoutes(app);
  await registerDemoRoutes(app);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    indexer?: ChainIndexer;
  }
}
