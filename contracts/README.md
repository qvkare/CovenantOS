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
| `EvidenceReceipt` | On-chain evidence hash registry (no PII) |
| `FacilityVault` | Escrow deposit, hold, release, reserve top-up |

## Key flows

- `propose_action` → `approve_action` (weighted signers) → `ActionExecutable` event
- `FacilityVault::hold/release/top_up_reserve` calls `PolicyGuard::consume_executable_action`
- Pause blocks all policy and vault fund movements
- Each approved action can be consumed exactly once

Deploy addresses are written to `shared/config/testnet.json` after testnet deployment.
