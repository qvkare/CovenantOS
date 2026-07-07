import type { ChainEventType } from "@covenantos/shared";
import { ContractRegistry } from "../chain/contracts.js";

export type IndexerConfig = {
  enabled: boolean;
  mode: "cspr-cloud" | "local-only";
  csprCloudToken?: string;
  streamingBaseUrl: string;
  contractPackageHashes: string[];
};

export function normalizeContractHash(hash: string): string {
  return hash.startsWith("hash-") ? hash.slice(5) : hash;
}

export function loadIndexerConfig(): IndexerConfig {
  const registry = ContractRegistry.load();
  const contracts = registry.snapshot();
  const packageHashes = [
    contracts.policyGuard.packageHash,
    contracts.evidenceReceipt.packageHash,
    contracts.facilityVault.packageHash,
  ]
    .filter((hash) => hash.length > 0)
    .map(normalizeContractHash);

  const token = process.env.CSPR_CLOUD_AUTH_TOKEN?.trim();
  const streamingBaseUrl =
    process.env.CSPR_CLOUD_STREAMING_URL?.trim() ??
    "wss://streaming.testnet.cspr.cloud";

  const explicitlyDisabled = process.env.INDEXER_ENABLED === "false";
  const canUseCsprCloud = Boolean(token) && packageHashes.length > 0;

  return {
    enabled: !explicitlyDisabled,
    mode: canUseCsprCloud ? "cspr-cloud" : "local-only",
    csprCloudToken: token,
    streamingBaseUrl,
    contractPackageHashes: packageHashes,
  };
}

export const INDEXER_KNOWN_EVENT_TYPES: ChainEventType[] = [
  "ActionProposed",
  "ActionApproved",
  "ActionExecutable",
  "FacilityPaused",
  "EvidenceRecorded",
  "Deposited",
  "Held",
  "Released",
  "ReserveToppedUp",
  "BreachDetected",
];

export function isKnownEventType(name: string): name is ChainEventType {
  return (INDEXER_KNOWN_EVENT_TYPES as string[]).includes(name);
}
