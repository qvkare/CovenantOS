import type {
  AccountType,
  CsprClickInitOptions,
  ICSPRClickSDK,
} from "@make-software/csprclick-core-types";
import type { ClickUIOptions } from "@make-software/csprclick-core-types/clickui";

declare global {
  interface Window {
    csprclick?: ICSPRClickSDK;
    clickSDKOptions?: CsprClickInitOptions;
    clickUIOptions?: ClickUIOptions;
  }
}

export {};

export type ClickAccount = AccountType;
