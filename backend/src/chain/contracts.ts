import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TestnetConfig } from "./config.js";
import { loadTestnetConfig } from "./config.js";

export type ContractKey = keyof TestnetConfig["contracts"];

export function normalizePackageHash(hash: string): string {
  return hash.startsWith("hash-") ? hash.slice(5) : hash;
}

export class ContractRegistry {
  constructor(private readonly config: TestnetConfig) {}

  static load(configPath?: string): ContractRegistry {
    return new ContractRegistry(loadTestnetConfig(configPath));
  }

  get networkName(): string {
    return this.config.networkName;
  }

  get nodeUrl(): string {
    return this.config.nodeUrl;
  }

  address(name: ContractKey): string | undefined {
    const hash = this.config.contracts[name].contractHash;
    return hash.length > 0 ? hash : undefined;
  }

  isDeployed(name: ContractKey): boolean {
    return Boolean(this.address(name));
  }

  allDeployed(): boolean {
    return (
      this.isDeployed("policyGuard") &&
      this.isDeployed("evidenceReceipt") &&
      this.isDeployed("facilityVault")
    );
  }

  snapshot(): TestnetConfig["contracts"] {
    return this.config.contracts;
  }
}

export function syncTestnetConfigFromOdraToml(
  tomlPath: string,
  configPath?: string,
): TestnetConfig {
  const toml = fs.readFileSync(tomlPath, "utf8");
  const config = loadTestnetConfig(configPath);
  const updated = { ...config, contracts: { ...config.contracts } };

  const mapping: Record<string, ContractKey> = {
    PolicyGuard: "policyGuard",
    EvidenceReceipt: "evidenceReceipt",
    FacilityVault: "facilityVault",
  };

  for (const [contractName, configKey] of Object.entries(mapping)) {
    const packageNameRegex = new RegExp(
      `name\\s*=\\s*"${contractName}"[\\s\\S]*?package_hash\\s*=\\s*"([^"]+)"`,
    );
    const match = toml.match(packageNameRegex);
    if (match?.[1]) {
      updated.contracts[configKey] = {
        packageHash: match[1],
        contractHash: match[1],
      };
    }
  }

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const resolved = configPath ?? path.join(root, "shared/config/testnet.json");
  fs.writeFileSync(resolved, `${JSON.stringify(updated, null, 2)}\n`);

  return updated;
}
