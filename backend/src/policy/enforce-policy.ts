import { defaultAgentPolicy, type AgentRuntimePolicy } from "./runtime-policy.js";

export class PolicyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyViolationError";
  }
}

export function assertToolAllowed(tool: string, policy: AgentRuntimePolicy = defaultAgentPolicy): void {
  if (!policy.allowedTools.includes(tool)) {
    throw new PolicyViolationError(`Tool not allowed by runtime policy: ${tool}`);
  }
}

export function assertCounterpartyAllowed(
  counterparty: string,
  policy: AgentRuntimePolicy = defaultAgentPolicy,
): void {
  if (!policy.allowedCounterparties.includes(counterparty)) {
    throw new PolicyViolationError(`Counterparty not allowed by runtime policy: ${counterparty}`);
  }
}

export function assertSpendWithinLimit(
  amountMotes: bigint,
  policy: AgentRuntimePolicy = defaultAgentPolicy,
): void {
  if (amountMotes > policy.maxSpendMotes) {
    throw new PolicyViolationError("Spend exceeds agent max spend policy");
  }
}

export function assertEscalationRequired(
  policy: AgentRuntimePolicy = defaultAgentPolicy,
): void {
  if (policy.escalationRequired) {
    // Hold/release/top_up always require officer approval in CovenantOS.
    return;
  }
}
