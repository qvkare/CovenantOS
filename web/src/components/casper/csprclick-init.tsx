import Script from "next/script";

import {
  CSPRCLICK_APP_ID,
  CSPRCLICK_SCRIPT_URL,
} from "@/lib/casper/click-config";

/** Inline globals must exist before the CSPR.click CDN script executes. */
const INIT_SCRIPT = `
window.clickUIOptions = {
  uiContainer: "csprclick-ui",
  rootAppElement: "body",
  showTopBar: false,
  show1ClickModal: true,
  accountMenuItems: []
};
window.clickSDKOptions = {
  appName: "CovenantOS",
  appId: ${JSON.stringify(CSPRCLICK_APP_ID)},
  providers: ["casper-wallet", "ledger", "metamask-snap"],
  contentMode: "iframe"
};
`.trim();

export function CsprClickInit() {
  return (
    <>
      <Script id="covenantos-csprclick-init" strategy="beforeInteractive">
        {INIT_SCRIPT}
      </Script>
      <Script
        id="csprclick-client"
        src={CSPRCLICK_SCRIPT_URL}
        strategy="afterInteractive"
      />
    </>
  );
}
