const EXPLORER_BASE = "https://testnet.cspr.live";

export function explorerTx(deployHash: string): string {
  return `${EXPLORER_BASE}/deploy/${deployHash}`;
}

export function explorerAccount(publicKey: string): string {
  return `${EXPLORER_BASE}/account/${publicKey}`;
}

export function explorerPackage(packageHash: string): string {
  return `${EXPLORER_BASE}/package/${packageHash}`;
}
