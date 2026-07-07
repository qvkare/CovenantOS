import { z } from "zod";

export const x402EnvSchema = z.object({
  PROVIDER_URL: z.string().url().default("http://localhost:3002"),
  X402_PAYMENT_AMOUNT_MOTES: z.coerce.bigint().default(2_500_000_000n),
  X402_BUDGET_CAP_MOTES: z.coerce.bigint().default(10_000_000_000n),
  CASPER_NODE_URL: z.string().url().default("https://node.testnet.casper.network/rpc"),
  CASPER_CHAIN_NAME: z.string().default("casper-test"),
});

export type X402Env = z.infer<typeof x402EnvSchema>;

export function loadX402Env(env: NodeJS.ProcessEnv = process.env): X402Env {
  return x402EnvSchema.parse(env);
}
