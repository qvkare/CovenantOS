import type { FastifyInstance } from "fastify";
import { resetDemoStore } from "@covenantos/shared";
import { getPool } from "../db/index.js";
import { ensureAppStoreSeeded, resetAppStorePersistence } from "../store/persisting-store.js";

function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE !== "false";
}

function isAuthorized(request: { headers: Record<string, unknown> }): boolean {
  const token = process.env.DEMO_RESET_TOKEN?.trim();
  if (!token) return isDemoModeEnabled();

  const header = request.headers["x-demo-reset-token"];
  return typeof header === "string" && header === token;
}

export async function registerDemoRoutes(app: FastifyInstance) {
  app.post("/demo/reset", async (request, reply) => {
    if (!isDemoModeEnabled()) {
      return reply.status(403).send({ error: "Demo mode is disabled" });
    }

    if (!isAuthorized(request)) {
      return reply.status(401).send({ error: "Invalid demo reset token" });
    }

    resetDemoStore();

    const pool = getPool();
    if (pool) {
      await resetAppStorePersistence();
      await ensureAppStoreSeeded();
    }

    return reply.send({
      ok: true,
      message: "Demo state reset to seed fixtures",
      facilities: ["fac-demo-001", "fac-demo-002"],
    });
  });
}
