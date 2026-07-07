import type {
  AccountType,
  CsprClickInitOptions,
  ICSPRClickSDK,
} from "@make-software/csprclick-core-types";

declare global {
  interface Window {
    csprclick?: ICSPRClickSDK;
    clickSDKOptions?: CsprClickInitOptions;
  }
}

export {};

export type ClickAccount = AccountType;
