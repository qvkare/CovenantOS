import casperSdk from "casper-js-sdk";

export const {
  AccountHash,
  HttpHandler,
  KeyAlgorithm,
  NativeTransferBuilder,
  PrivateKey,
  PurseIdentifier,
  RpcClient,
  Timestamp,
} = casperSdk;

export type CasperPrivateKey = InstanceType<typeof PrivateKey>;
export type CasperRpcClient = InstanceType<typeof RpcClient>;
