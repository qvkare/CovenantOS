import type { ChainEvent } from "@covenantos/shared";
import { eventBus } from "../events/bus.js";

export type WaitForActionIdInput = {
  proposeTxHash: string;
  paramsHash?: string;
  timeoutMs?: number;
};

function matchesProposedEvent(event: ChainEvent, input: WaitForActionIdInput): boolean {
  if (event.type !== "ActionProposed") return false;
  if (event.txHash === input.proposeTxHash) return true;

  const paramsHash = event.payload?.params_hash;
  return (
    typeof paramsHash === "string" &&
    typeof input.paramsHash === "string" &&
    paramsHash === input.paramsHash
  );
}

export function actionIdFromChainEvent(event: ChainEvent): string | undefined {
  if (event.type !== "ActionProposed") return undefined;
  const raw = event.payload?.action_id;
  if (raw === undefined || raw === null) return undefined;
  return String(raw);
}

/** Wait for CSPR.cloud ActionProposed event matching a propose tx hash. */
export function waitForOnChainActionId(input: WaitForActionIdInput): Promise<string | undefined> {
  const timeoutMs = input.timeoutMs ?? 15_000;

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: string | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(value);
    };

    const unsubscribe = eventBus.subscribe((event) => {
      if (event.payload?.source !== "chain") return;
      if (!matchesProposedEvent(event, input)) return;
      finish(actionIdFromChainEvent(event));
    });

    const timer = setTimeout(() => finish(undefined), timeoutMs);
  });
}
