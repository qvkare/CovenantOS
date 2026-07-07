# CovenantOS

Agentic covenant monitoring and cashflow waterfall OS for tokenized private credit and receivable-based RWAs on [Casper Network](https://www.casper.network/).

CovenantOS reads facility documents, extracts covenants, collects evidence via paid data providers (x402), detects breaches, and enforces escrow and payment flows on-chain through policy-driven smart contracts.

## Status

Built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon/detail).

**Current phase:** Security hardening + demo polish (Phase 8)

## Architecture

```mermaid
flowchart LR
  subgraph ingest [Ingest]
    Doc[Document Agent]
    X402[x402 Gateway]
    Prov[Data Provider]
  end

  subgraph orchestrator [Backend]
    Cov[Covenant Agent]
    Tre[Treasury Agent]
    Bus[Event Bus]
    Idx[Chain Indexer]
    DB[(Postgres)]
  end

  subgraph chain [Casper Testnet]
    PG[PolicyGuard]
    ER[EvidenceReceipt]
    FV[FacilityVault]
  end

  subgraph ui [Web Dashboard]
    Dash[Next.js UI]
    SSE[SSE Client]
  end

  Doc --> Cov
  X402 --> Prov
  Prov --> X402
  X402 --> Cov
  Cov --> PG
  Tre --> FV
  PG --> FV
  Idx --> Bus
  Cov --> Bus
  Tre --> Bus
  Bus --> DB
  Bus --> SSE
  SSE --> Dash
  Idx -. CSPR.cloud WS .-> chain
```

## Monorepo

| Package | Description |
|---|---|
| `contracts/` | Rust + Odra smart contracts (PolicyGuard, EvidenceReceipt, FacilityVault) |
| `backend/` | Node.js + Fastify orchestrator and agents |
| `provider/` | x402 data provider — paid bank/ERP evidence API with on-chain payment verification |
| `shared/` | Shared TypeScript types and testnet config |
| `web/` | Next.js dashboard |

## Quick start

```bash
cp .env.example .env
npm install
npm run build -w @covenantos/shared
npm run dev          # backend on :3001
npm run dev:provider  # x402 data provider on :3002
npm run dev -w @covenantos/web   # dashboard on :3000
```

With Docker:

```bash
docker compose up --build
```

Reset demo fixtures:

```bash
npm run demo:reset -w backend
# or: curl -X POST http://localhost:3001/demo/reset
```

## Demo walkthrough

1. **Start stack** — `docker compose up --build` or local dev servers above.
2. **Open dashboard** — http://localhost:3000 — two seed facilities:
   - `fac-demo-001` Northwind (healthy)
   - `fac-demo-002` Atlas Receivables (breach demo)
3. **Trigger breach check** on Atlas:
   ```bash
   curl -X POST http://localhost:3001/facilities/fac-demo-002/check \
     -H 'Content-Type: application/json' \
     -d '{"scenario":"breach"}'
   ```
4. **Approve hold** — open Approvals in the UI or:
   ```bash
   curl -X POST http://localhost:3001/actions/<action-id>/approve \
     -H 'Content-Type: application/json' \
     -d '{"approver":"officer-1"}'
   ```
5. **Watch live events** — `GET /events/stream` (SSE) or the activity feed on the facility page.
6. **Optional** — upload a facility agreement via `POST /facilities/extract` (requires `ANTHROPIC_API_KEY`).

## Chain / testnet

Put your deployer secret in `keys/deployer_secret_key.pem` (or set `CASPER_SECRET_KEY_HEX` in `.env`; never commit secrets).

```bash
npm run chain:wallet -w backend   # balance check
```

Deploy contracts after the wallet is funded on testnet. Requires `binaryen` and `wabt` (`brew install binaryen wabt`) for Odra WASM optimization.

```bash
cd contracts
env -u CARGO_TARGET_DIR cargo odra build
set -a && source ../.env && set +a
env -u CARGO_TARGET_DIR cargo run --bin covenantos_contracts_cli -- deploy --deploy-mode default
npm run chain:sync-deploy -w backend   # writes addresses to shared/config/testnet.json
```

`CSPR_CLOUD_AUTH_TOKEN` from [console.cspr.build](https://console.cspr.build) enables live contract-event indexing over WebSocket.

## API summary

| Endpoint | Description |
|---|---|
| `GET /health` | Service, DB, and indexer status |
| `GET /chain/status` | Testnet wallet and deployed contracts |
| `POST /facilities/extract` | Document Agent — covenant extraction |
| `POST /facilities/:id/check` | x402 fetch + covenant evaluation |
| `POST /facilities/:id/evidence` | Fetch and record bank statement evidence |
| `GET /actions` | Pending and executed policy actions |
| `POST /actions/:id/approve` | Officer approval → treasury execute |
| `GET /events/stream` | SSE live event feed |
| `GET /events` | Historical events from Postgres |
| `POST /demo/reset` | Reset in-memory demo state |

## Security

- **Runtime policy** — tool allowlist, counterparty allowlist, spend caps on x402 and treasury top-ups
- **Evidence guard** — adversarial payload filtering before covenant evaluation
- **Evidence-before-action** — hold actions require linked evidence; officer multisig before execution
- **Log redaction** — secrets, payment headers, and raw evidence payloads redacted in logs

## Implementation phases

1. Monorepo scaffold + docker-compose + CI ✓
2. Odra contract trio + tests ✓
3. Testnet deploy + chain service ✓
4. Document Agent + golden-file tests ✓
5. x402 gateway + data provider ✓
6. Covenant + Treasury agents + approval flow ✓
7. Indexer + SSE ✓
8. Security hardening, seed demo, README polish ✓

## Stack

- **Smart contracts:** Rust + [Odra](https://odra.dev/)
- **Backend:** Node.js + TypeScript (Fastify)
- **Frontend:** Next.js
- **Chain:** Casper Testnet, casper-js-sdk, CSPR.cloud

## License

TBD
