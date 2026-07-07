"use client";

import type { AccountType, ICSPRClickSDK } from "@make-software/csprclick-core-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface ClickContextState {
  ready: boolean;
  signedIn: boolean;
  publicKey: string | undefined;
  provider: string | undefined;
  clickRef: ICSPRClickSDK | undefined;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ClickContext = createContext<ClickContextState | undefined>(undefined);

const APP_ID =
  process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID ?? "csprclick-template";

export function ClickProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [clickRef, setClickRef] = useState<ICSPRClickSDK | undefined>();
  const [account, setAccount] = useState<AccountType | undefined>();

  const syncAccount = useCallback(async (ref: ICSPRClickSDK) => {
    try {
      const active = await ref.getActiveAccountAsync({ withBalance: false });
      setAccount(active?.public_key ? active : undefined);
    } catch {
      setAccount(undefined);
    }
  }, []);

  useEffect(() => {
    window.clickSDKOptions = {
      appName: "CovenantOS",
      appId: APP_ID,
      providers: ["casper-wallet", "ledger", "metamask-snap"],
      contentMode: "iframe",
    };

    const onLoaded = () => {
      if (!window.csprclick) return;
      const ref = window.csprclick;
      setClickRef(ref);
      setReady(true);
      void syncAccount(ref);

      ref.on("csprclick:signed_in", () => void syncAccount(ref));
      ref.on("csprclick:switched_account", () => void syncAccount(ref));
      ref.on("csprclick:signed_out", () => setAccount(undefined));
      ref.on("csprclick:account_changed", (event: { detail?: AccountType }) => {
        const next = event.detail;
        setAccount(next?.public_key ? next : undefined);
      });
    };

    window.addEventListener("csprclick:loaded", onLoaded);
    if (window.csprclick) onLoaded();

    if (!document.querySelector("script#csprclick-client")) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";
      script.async = true;
      script.id = "csprclick-client";
      document.head.appendChild(script);
    }

    return () => {
      window.removeEventListener("csprclick:loaded", onLoaded);
    };
  }, [syncAccount]);

  const signIn = useCallback(async () => {
    if (!clickRef) return;
    const sdk = clickRef as ICSPRClickSDK & {
      signIn?: () => Promise<void>;
      open?: () => Promise<void>;
    };
    if (typeof sdk.signIn === "function") {
      await sdk.signIn();
    } else if (typeof sdk.open === "function") {
      await sdk.open();
    }
  }, [clickRef]);

  const signOut = useCallback(async () => {
    if (!clickRef) return;
    await clickRef.signOut();
    setAccount(undefined);
  }, [clickRef]);

  return (
    <ClickContext.Provider
      value={{
        ready,
        signedIn: Boolean(account?.public_key),
        publicKey: account?.public_key,
        provider: account?.provider,
        clickRef,
        signIn,
        signOut,
      }}
    >
      {children}
    </ClickContext.Provider>
  );
}

export function useClickWallet(): ClickContextState {
  const ctx = useContext(ClickContext);
  if (!ctx) {
    throw new Error("useClickWallet must be used within ClickProvider");
  }
  return ctx;
}
