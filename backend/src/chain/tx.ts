import type { ContractKey } from "./contracts.js";
import { normalizePackageHash, type ContractRegistry } from "./contracts.js";
import {
  ContractCallBuilder,
  HttpHandler,
  RpcClient,
  Timestamp,
  type CasperArgs,
  type CasperPrivateKey,
  type CasperTransaction,
  type CasperWaitResult,
} from "./casper-sdk.js";
import { loadChainEnv } from "./config.js";
import { loadPrivateKeyFromEnv } from "./signer.js";

const DEFAULT_CONTRACT_PAYMENT = 5_000_000_000;

export type ContractCallInput = {
  contract: ContractKey;
  entryPoint: string;
  args: CasperArgs;
  paymentMotes?: number;
};

export type SubmittedContractCall = {
  txHash: string;
  result: CasperWaitResult;
};

export function tryLoadSigner(): CasperPrivateKey | undefined {
  try {
    return loadPrivateKeyFromEnv();
  } catch {
    return undefined;
  }
}

export function parseProposedActionId(result: CasperWaitResult): string | undefined {
  const fromEffects = parseProposedActionIdFromEffects(result);
  if (fromEffects) return fromEffects;

  const raw = result.rawJSON;
  if (!raw) return undefined;

  // Fallback: scan serialized execution payload for Odra event fields.
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  const match = text.match(/"action_id"\s*:\s*"?(\d+)"?/);
  return match?.[1];
}

const ACTION_PROPOSED_EVENT_MARKER = Buffer.from("event_ActionProposed", "utf8");

function readU64Le(bytes: Buffer, offset: number): bigint | undefined {
  if (offset + 8 > bytes.length) return undefined;
  let value = 0n;
  for (let i = 0; i < 8; i += 1) {
    value |= BigInt(bytes[offset + i] ?? 0) << BigInt(i * 8);
  }
  return value;
}

/** Parse action_id from Odra ActionProposed event bytes in execution effects. */
export function parseActionIdFromProposedEventBytes(bytes: Buffer): string | undefined {
  const markerIndex = bytes.indexOf(ACTION_PROPOSED_EVENT_MARKER);
  if (markerIndex < 0) return undefined;

  const actionIdOffset = markerIndex + ACTION_PROPOSED_EVENT_MARKER.length;
  const actionId = readU64Le(bytes, actionIdOffset);
  if (actionId === undefined || actionId === 0n) return undefined;

  return String(actionId);
}

function clValueBytes(cl: { bytes?: string } | undefined): Buffer | undefined {
  if (!cl?.bytes) return undefined;
  try {
    return Buffer.from(cl.bytes, "hex");
  } catch {
    return undefined;
  }
}

/** Read PolicyGuard action_id from ActionProposed event effects. */
export function parseProposedActionIdFromEffects(result: CasperWaitResult): string | undefined {
  const raw = result.rawJSON;
  if (!raw) return undefined;

  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const effects = parsed?.execution_info?.execution_result?.Version2?.effects;
  if (!Array.isArray(effects)) return undefined;

  for (const effect of effects) {
    const kind = effect?.kind;
    if (!kind || typeof kind !== "object") continue;

    const write = "Write" in kind ? kind.Write : undefined;
    const cl = write?.CLValue ?? write;
    const bytes = clValueBytes(cl);
    if (!bytes) continue;

    const actionId = parseActionIdFromProposedEventBytes(bytes);
    if (actionId) return actionId;
  }

  return undefined;
}

export class ChainTxSubmitter {
  private readonly rpc: InstanceType<typeof RpcClient>;
  private readonly privateKey: CasperPrivateKey;
  private readonly chainName: string;

  constructor(
    private readonly registry: ContractRegistry,
    privateKey?: CasperPrivateKey,
  ) {
    const env = loadChainEnv();
    this.chainName = env.CASPER_CHAIN_NAME;
    this.rpc = new RpcClient(new HttpHandler(env.CASPER_NODE_URL));
    this.privateKey = privateKey ?? loadPrivateKeyFromEnv();
  }

  static tryCreate(registry: ContractRegistry): ChainTxSubmitter | undefined {
    const privateKey = tryLoadSigner();
    if (!privateKey || !registry.allDeployed()) {
      return undefined;
    }
    return new ChainTxSubmitter(registry, privateKey);
  }

  get signerPublicKey() {
    return this.privateKey.publicKey;
  }

  async submit(input: ContractCallInput): Promise<SubmittedContractCall> {
    const packageHash = this.registry.snapshot()[input.contract].packageHash;
    const transaction = this.buildTransaction(packageHash, input);
    transaction.sign(this.privateKey);

    const put = await this.rpc.putTransaction(transaction);
    const txHash = put.transactionHash.toHex();
    const result = await this.rpc.waitForTransaction(transaction, 120_000);

    const execution = result.executionInfo?.executionResult;
    if (execution?.errorMessage) {
      throw new Error(`On-chain ${input.entryPoint} failed: ${execution.errorMessage}`);
    }

    return { txHash, result };
  }

  private buildTransaction(
    packageHash: string,
    input: ContractCallInput,
  ): CasperTransaction {
    const normalizedHash = normalizePackageHash(packageHash);
    return new ContractCallBuilder()
      .from(this.privateKey.publicKey)
      .byPackageHash(normalizedHash)
      .entryPoint(input.entryPoint)
      .runtimeArgs(input.args)
      .chainName(this.chainName)
      .payment(input.paymentMotes ?? DEFAULT_CONTRACT_PAYMENT)
      .timestamp(new Timestamp(new Date()))
      .build();
  }
}
