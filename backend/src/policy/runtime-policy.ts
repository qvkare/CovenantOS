export interface AgentRuntimePolicy {
  maxSpendMotes: bigint;
  allowedTools: string[];
  allowedCounterparties: string[];
  escalationRequired: boolean;
}

export const defaultAgentPolicy: AgentRuntimePolicy = {
  maxSpendMotes: 10_000_000_000n, // 10 CSPR in motes
  allowedTools: ["x402:mock-bank-statement"],
  allowedCounterparties: ["mock-provider"],
  escalationRequired: true,
};
