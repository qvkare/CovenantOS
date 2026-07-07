import type { CsprClickInitOptions } from "@make-software/csprclick-core-types";
import type { ClickUIOptions } from "@make-software/csprclick-core-types/clickui";

export const CSPRCLICK_APP_ID =
  process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID ?? "csprclick-template";

export const CSPRCLICK_SCRIPT_URL =
  "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";

/**
 * Keep UI options minimal when hiding the CSPR.click top bar.
 * Per SDK docs, theme/account/network selectors override showTopBar:false.
 * Wallet connect stays on our WalletButton + sign-in modal (show1ClickModal).
 */
export function buildClickUIOptions(): ClickUIOptions {
  return {
    uiContainer: "csprclick-ui",
    rootAppElement: "body",
    showTopBar: false,
    show1ClickModal: true,
    accountMenuItems: [],
  };
}

export function buildClickSDKOptions(): CsprClickInitOptions {
  return {
    appName: "CovenantOS",
    appId: CSPRCLICK_APP_ID,
    providers: ["casper-wallet", "ledger", "metamask-snap"],
    contentMode: "iframe",
  };
}

export function applyClickGlobals(): void {
  if (typeof window === "undefined") return;
  window.clickUIOptions = buildClickUIOptions();
  window.clickSDKOptions = buildClickSDKOptions();
}
