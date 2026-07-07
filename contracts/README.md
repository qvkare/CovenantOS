# CovenantOS Contracts

Rust + [Odra](https://odra.dev/) smart contracts for Casper Testnet.

## Prerequisites

- Rust stable
- `cargo install cargo-odra --locked`

## Commands

```bash
cargo odra test
cargo odra test -b casper
cargo odra build -b casper
```

## Contracts (MVP)

| Contract | Purpose |
|---|---|
| `PolicyGuard` | Action thresholds, multisig approval, pause kill-switch |
| `EvidenceReceipt` | On-chain evidence hash registry |
| `FacilityVault` | Escrow hold/release tied to approved actions |

Deploy addresses are written to `shared/config/testnet.json` after Phase 3.
