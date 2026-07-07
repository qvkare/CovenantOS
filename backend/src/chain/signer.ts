import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";

function loadPrivateKeyFromPem(pemContents: string): PrivateKey {
  for (const algorithm of [KeyAlgorithm.ED25519, KeyAlgorithm.SECP256K1]) {
    try {
      return PrivateKey.fromPem(pemContents, algorithm);
    } catch {
      // try next algorithm
    }
  }
  throw new Error("Unsupported PEM format for Casper keys");
}

function resolvePemPath(configuredPath?: string): string | undefined {
  if (!configuredPath) {
    return undefined;
  }
  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  return path.resolve(root, configuredPath);
}

export function loadPrivateKeyFromEnv(env: NodeJS.ProcessEnv = process.env): PrivateKey {
  const secretHex = env.CASPER_SECRET_KEY_HEX?.trim();
  if (secretHex) {
    return PrivateKey.fromHex(secretHex, KeyAlgorithm.ED25519);
  }

  const pemPath = resolvePemPath(env.CASPER_SECRET_KEY_PATH ?? "./keys/deployer_secret_key.pem");
  if (pemPath && fs.existsSync(pemPath)) {
    return loadPrivateKeyFromPem(fs.readFileSync(pemPath, "utf8"));
  }

  throw new Error(
    "Configure CASPER_SECRET_KEY_HEX or CASPER_SECRET_KEY_PATH for Casper signing",
  );
}
