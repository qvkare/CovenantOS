import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerHealthRoutes } from "./routes/health.js";
import { registerFacilityRoutes } from "./routes/facilities.js";
import { registerActionRoutes } from "./routes/actions.js";
import { registerEventRoutes } from "./routes/events.js";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });

  await registerHealthRoutes(app);
  await registerFacilityRoutes(app);
  await registerActionRoutes(app);
  await registerEventRoutes(app);

  return app;
}
