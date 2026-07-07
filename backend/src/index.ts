import "dotenv/config";
import { buildServer } from "./server.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

async function main() {
  const app = await buildServer();
  await app.listen({ port, host });
  app.log.info(`CovenantOS backend listening on http://${host}:${port}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
