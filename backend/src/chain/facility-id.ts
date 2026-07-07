import { createHash } from "node:crypto";
import { DEMO_FACILITY_IDS } from "@covenantos/shared";

const DEMO_FACILITY_ONCHAIN: Record<string, bigint> = {
  [DEMO_FACILITY_IDS.healthy]: 1n,
  [DEMO_FACILITY_IDS.breach]: 2n,
};

/** Map app facility IDs to on-chain u64 keys used by Odra contracts. */
export function toFacilityU64(facilityId: string): bigint {
  const mapped = DEMO_FACILITY_ONCHAIN[facilityId];
  if (mapped !== undefined) {
    return mapped;
  }

  const hex = createHash("sha256").update(facilityId).digest("hex").slice(0, 12);
  return BigInt(`0x${hex}`) % 9_000_000_000_000n + 100n;
}

export const ACTION_TYPE_ONCHAIN = {
  hold: 1,
  release: 2,
  top_up: 3,
} as const;
