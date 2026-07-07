import { randomUUID } from "node:crypto";
import type { ChainEvent } from "@covenantos/shared";
import { isKnownEventType } from "./config.js";

export type CsprCloudContractMessage = {
  action?: string;
  timestamp?: string;
  data?: {
    contract_package_hash?: string;
    contract_hash?: string;
    name?: string;
    data?: Record<string, unknown>;
  };
  extra?: {
    deploy_hash?: string;
    block_height?: number;
    event_id?: number;
    transform_id?: number;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseCsprCloudMessage(
  raw: unknown,
  allowedPackageHashes: Set<string>,
): ChainEvent | null {
  const message = asRecord(raw) as CsprCloudContractMessage | null;
  if (!message || message.action !== "emitted") return null;

  const data = message.data;
  if (!data?.name || !isKnownEventType(data.name)) return null;

  const packageHash = data.contract_package_hash?.toLowerCase();
  if (packageHash && allowedPackageHashes.size > 0 && !allowedPackageHashes.has(packageHash)) {
    return null;
  }

  const payload = data.data ?? {};
  const deployHash = message.extra?.deploy_hash;
  const eventId = message.extra?.event_id ?? 0;
  const blockHeight = message.extra?.block_height;

  const facilityId =
    payload.facility_id !== undefined
      ? String(payload.facility_id)
      : payload.facilityId !== undefined
        ? String(payload.facilityId)
        : undefined;

  const id =
    deployHash !== undefined
      ? `chain-${deployHash}-${data.name}-${eventId}`
      : `chain-${randomUUID()}`;

  return {
    id,
    type: data.name,
    facilityId,
    payload: {
      ...payload,
      contractHash: data.contract_hash,
      contractPackageHash: data.contract_package_hash,
      source: "chain",
    },
    txHash: deployHash,
    blockHeight,
    createdAt: message.timestamp ?? new Date().toISOString(),
  };
}
