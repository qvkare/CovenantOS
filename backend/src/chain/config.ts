import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const testnetConfigSchema = z.object({
  networkName: z.string(),
  nodeUrl: z.string().url(),
  csprCloudUrl: z.string().url(),
  contracts: z.object({
    policyGuard: z.object({
      packageHash: z.string(),
      contractHash: z.string(),
    }),
    evidenceReceipt: z.object({
      packageHash: z.string(),
      contractHash: z.string(),
    }),
    facilityVault: z.object({
      packageHash: z.string(),
      contractHash: z.string(),
    }),
  }),
});

export type TestnetConfig = z.infer<typeof testnetConfigSchema>;

export function loadTestnetConfig(configPath?: string): TestnetConfig {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const resolved = configPath ?? path.join(root, "shared/config/testnet.json");
  const raw = JSON.parse(fs.readFileSync(resolved, "utf8")) as unknown;
  return testnetConfigSchema.parse(raw);
}

export const chainEnvSchema = z.object({
  CASPER_NODE_URL: z.string().url().default("https://node.testnet.casper.network/rpc"),
  CASPER_CHAIN_NAME: z.string().default("casper-test"),
  CASPER_SECRET_KEY_HEX: z.string().min(64).optional(),
  CASPER_PUBLIC_KEY: z.string().optional(),
  CASPER_SECRET_KEY_PATH: z.string().optional(),
  CSPR_CLOUD_URL: z.string().url().default("https://api.testnet.cspr.cloud"),
});

export type ChainEnv = z.infer<typeof chainEnvSchema>;

export function loadChainEnv(env: NodeJS.ProcessEnv = process.env): ChainEnv {
  return chainEnvSchema.parse(env);
}
