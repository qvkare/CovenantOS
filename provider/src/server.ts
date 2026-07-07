import "dotenv/config";
import Fastify from "fastify";
import { registerBankStatementRoute } from "./routes/bank-statement.js";

const port = Number(process.env.PORT ?? 3002);
const host = process.env.HOST ?? "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({
    status: "ok",
    service: "covenantos-provider",
    protocol: "x402",
  }));

  await registerBankStatementRoute(app);

  await app.listen({ port, host });
  app.log.info(`x402 data provider listening on http://${host}:${port}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
