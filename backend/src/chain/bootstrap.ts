import { DEMO_FACILITY_IDS } from "@covenantos/shared";
import type { ChainWriter } from "./writer.js";

const DEMO_VAULT_SEED_MOTES = "5000000000000";
const SIGNER_WEIGHT = 2;

let bootstrapPromise: Promise<void> | undefined;

export function ensureChainDemoReady(writer: ChainWriter): Promise<void> {
  if (!writer.canWriteOnChain()) {
    return Promise.resolve();
  }

  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap(writer);
  }

  return bootstrapPromise;
}

async function runBootstrap(writer: ChainWriter): Promise<void> {
  try {
    await writer.ensurePolicyGuardSignerWeight(SIGNER_WEIGHT);
  } catch (error) {
    console.warn("PolicyGuard signer bootstrap failed (may already be configured)", error);
  }

  for (const facilityId of [DEMO_FACILITY_IDS.healthy, DEMO_FACILITY_IDS.breach]) {
    try {
      await writer.seedDemoVaultBalance(facilityId, DEMO_VAULT_SEED_MOTES);
    } catch (error) {
      console.warn(`Vault seed bootstrap failed for ${facilityId}`, error);
    }
  }
}
