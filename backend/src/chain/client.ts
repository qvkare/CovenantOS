import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HttpHandler,
  KeyAlgorithm,
  PrivateKey,
  PurseIdentifier,
  RpcClient,
  type CasperPrivateKey,
  type CasperRpcClient,
} from "./casper-sdk.js";
import type { ChainEnv } from "./config.js";

export type ChainWalletInfo = {
  publicKey: string;
  accountHash: string;
  balanceMotes: string;
  balanceCspr: number;
};

function loadPrivateKeyFromPem(pemContents: string): CasperPrivateKey {
  for (const algorithm of [KeyAlgorithm.ED25519, KeyAlgorithm.SECP256K1]) {
    try {
      return PrivateKey.fromPem(pemContents, algorithm);
    } catch {
      // try next algorithm
    }
  }
  throw new Error("Unsupported PEM format for Casper keys");
}

function resolvePemPath(env: ChainEnv): string | undefined {
  if (!env.CASPER_SECRET_KEY_PATH) {
    return undefined;
  }
  if (path.isAbsolute(env.CASPER_SECRET_KEY_PATH)) {
    return env.CASPER_SECRET_KEY_PATH;
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  return path.resolve(root, env.CASPER_SECRET_KEY_PATH);
}

function loadPrivateKey(env: ChainEnv): CasperPrivateKey | undefined {
  if (env.CASPER_SECRET_KEY_HEX) {
    return PrivateKey.fromHex(env.CASPER_SECRET_KEY_HEX, KeyAlgorithm.ED25519);
  }

  const pemPath = resolvePemPath(env);
  if (pemPath && fs.existsSync(pemPath)) {
    return loadPrivateKeyFromPem(fs.readFileSync(pemPath, "utf8"));
  }

  return undefined;
}

export class CasperChainClient {
  readonly rpc: CasperRpcClient;
  readonly chainName: string;
  readonly nodeUrl: string;
  readonly csprCloudUrl: string;
  private readonly privateKey?: CasperPrivateKey;

  constructor(env: ChainEnv) {
    this.nodeUrl = env.CASPER_NODE_URL;
    this.chainName = env.CASPER_CHAIN_NAME;
    this.csprCloudUrl = env.CSPR_CLOUD_URL;
    this.rpc = new RpcClient(new HttpHandler(this.nodeUrl));
    this.privateKey = loadPrivateKey(env);
  }

  get isSignerConfigured(): boolean {
    return this.privateKey !== undefined;
  }

  get publicKeyHex(): string | undefined {
    return this.privateKey?.publicKey.toHex();
  }

  async getWalletInfo(): Promise<ChainWalletInfo | null> {
    if (!this.privateKey) {
      return null;
    }

    const publicKey = this.privateKey.publicKey;
    const accountHash = publicKey.accountHash().toHex();

    try {
      const balance = await this.rpc.queryLatestBalance(
        PurseIdentifier.fromPublicKey(publicKey),
      );
      const motes = balance.balance.toString();

      return {
        publicKey: publicKey.toHex(),
        accountHash,
        balanceMotes: motes,
        balanceCspr: Number(motes) / 1_000_000_000,
      };
    } catch {
      return {
        publicKey: publicKey.toHex(),
        accountHash,
        balanceMotes: "0",
        balanceCspr: 0,
      };
    }
  }

  async getNetworkStatus(): Promise<{ chainSpecName: string; apiVersion: string }> {
    const status = await this.rpc.getStatus();
    return {
      chainSpecName: status.chainSpecName,
      apiVersion: status.apiVersion,
    };
  }
}
