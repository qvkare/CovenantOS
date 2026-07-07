import casperSdk from "casper-js-sdk";

export const {
  AccountHash,
  Args,
  CLValue,
  ContractCallBuilder,
  HttpHandler,
  KeyAlgorithm,
  NativeTransferBuilder,
  PrivateKey,
  PublicKey,
  PurseIdentifier,
  RpcClient,
  Timestamp,
} = casperSdk;

export type CasperPrivateKey = InstanceType<typeof PrivateKey>;
export type CasperRpcClient = InstanceType<typeof RpcClient>;
export type CasperTransaction = ReturnType<InstanceType<typeof ContractCallBuilder>["build"]>;
export type CasperArgs = InstanceType<typeof Args>;
export type CasperWaitResult = Awaited<ReturnType<InstanceType<typeof RpcClient>["waitForTransaction"]>>;
