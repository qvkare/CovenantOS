import casperSdk from "casper-js-sdk";
import {
  normalizeAccountHash,
  parsePaymentHeader,
  toPaymentAddress,
} from "@covenantos/shared";

const { HttpHandler, RpcClient } = casperSdk;

type RpcClientInstance = InstanceType<typeof RpcClient>;
type TransactionResult = Awaited<
  ReturnType<RpcClientInstance["getTransactionByTransactionHash"]>
>;

export type PaymentVerificationInput = {
  paymentHeader: string;
  expectedPayeeAccountHash: string;
  expectedAmountMotes: bigint;
  nodeUrl: string;
};

function transactionSucceeded(result: TransactionResult): boolean {
  const raw = result.rawJSON as {
    execution_info?: { execution_result?: { Version2?: { error_message?: string | null } } };
  };

  const errorMessage = raw.execution_info?.execution_result?.Version2?.error_message;
  return errorMessage == null;
}

function extractTransferAmount(result: TransactionResult): bigint | null {
  const raw = result.rawJSON as {
    transaction?: {
      Version1?: {
        payload?: {
          fields?: {
            args?: {
              Named?: Array<[string, { parsed?: string | number }]>;
            };
          };
        };
      };
    };
  };

  const named = raw.transaction?.Version1?.payload?.fields?.args?.Named;
  if (!named) {
    return null;
  }

  const amountEntry = named.find(([key]) => key === "amount");
  if (!amountEntry) {
    return null;
  }

  const parsed = amountEntry[1]?.parsed;
  if (parsed == null) {
    return null;
  }

  return BigInt(String(parsed));
}

export async function verifyX402Payment(input: PaymentVerificationInput): Promise<void> {
  const parsed = parsePaymentHeader(input.paymentHeader);
  const expectedPayee = normalizeAccountHash(input.expectedPayeeAccountHash);

  if (parsed.payeeAccountHash !== expectedPayee) {
    throw new Error("Payment recipient does not match provider account");
  }

  if (parsed.amountMotes !== input.expectedAmountMotes) {
    throw new Error("Payment amount does not match provider requirement");
  }

  const rpc = new RpcClient(new HttpHandler(input.nodeUrl));
  const result = await rpc.getTransactionByTransactionHash(parsed.transactionHash);

  if (!transactionSucceeded(result)) {
    throw new Error("Payment transaction did not succeed on Casper testnet");
  }

  const observedAmount = extractTransferAmount(result);
  if (observedAmount != null && observedAmount < parsed.amountMotes) {
    throw new Error("On-chain transfer amount is lower than required payment");
  }
}

export function resolveExpectedPayeeAccountHash(env: NodeJS.ProcessEnv): string {
  const configured = env.X402_PAYEE_ACCOUNT_HASH?.trim();
  if (!configured) {
    throw new Error("X402_PAYEE_ACCOUNT_HASH is required for the data provider");
  }
  return normalizeAccountHash(configured);
}

export function paymentRequiredHeaders(payeeAccountHash: string, amountMotes: bigint) {
  return {
    "X-Payment-Address": toPaymentAddress(payeeAccountHash),
    "X-Payment-Amount": amountMotes.toString(),
    "X-Payment-Network": "casper",
  };
}
