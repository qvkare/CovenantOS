import "dotenv/config";
import { buildServer } from "./server.js";
import { initDatabase, closeDatabase, isDatabaseEnabled } from "./db/index.js";
import { ensureAppStoreSeeded } from "./store/persisting-store.js";
import { wireDemoStoreEvents, wireChainStoreSync, wireEventPersistence } from "./events/wire.js";
import { eventBus } from "./events/bus.js";
import { ChainIndexer, loadIndexerConfig } from "./indexer/index.js";
import { CovenantCheckScheduler } from "./scheduler/covenant-check.js";
import { ensureChainDemoReady } from "./chain/bootstrap.js";
import { ChainWriter } from "./chain/writer.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

let indexer: ChainIndexer | undefined;
let covenantScheduler: CovenantCheckScheduler | undefined;

async function main() {
  wireDemoStoreEvents();
  wireChainStoreSync();
  wireEventPersistence();

  if (isDatabaseEnabled()) {
    try {
      await initDatabase();
      await ensureAppStoreSeeded();
    } catch (error) {
      console.warn("Database init failed — continuing without Postgres persistence", error);
    }
  }

  covenantScheduler = new CovenantCheckScheduler();
  covenantScheduler.start();

  const indexerConfig = loadIndexerConfig();
  if (indexerConfig.enabled) {
    indexer = new ChainIndexer(indexerConfig, (event) => {
      eventBus.publish(event);
    });
    const status = indexer.start();
    console.info(`Indexer started (${status.mode}, connected=${status.connected})`);
  }

  const app = await buildServer({ indexer });

  void ensureChainDemoReady(new ChainWriter()).catch((error) => {
    console.warn("Chain demo bootstrap skipped or partially failed", error);
  });

  app.addHook("onClose", async () => {
    covenantScheduler?.stop();
    indexer?.stop();
    await closeDatabase();
  });

  await app.listen({ port, host });
  app.log.info(`CovenantOS backend listening on http://${host}:${port}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
