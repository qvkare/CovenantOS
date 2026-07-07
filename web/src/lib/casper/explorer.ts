const EXPLORER_BASE = "https://testnet.cspr.live";

/** True for 64-char deploy/transaction hashes (excludes mock deploy-* placeholders). */
export function isExplorerTxHash(hash: string): boolean {
  const normalized = hash.trim().replace(/^0x/i, "");
  return /^[0-9a-f]{64}$/i.test(normalized);
}

export function explorerTx(deployHash: string): string {
  const normalized = deployHash.trim().replace(/^0x/i, "");
  return `${EXPLORER_BASE}/deploy/${normalized}`;
}

export function explorerAccount(publicKey: string): string {
  return `${EXPLORER_BASE}/account/${publicKey}`;
}

export function explorerPackage(packageHash: string): string {
  return `${EXPLORER_BASE}/package/${packageHash}`;
}
