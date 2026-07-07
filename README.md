# CovenantOS

Agentic covenant monitoring and cashflow waterfall OS for tokenized private credit and receivable-based RWAs on [Casper Network](https://www.casper.network/).

CovenantOS reads facility documents, extracts covenants, collects evidence via paid data providers (x402), detects breaches, and enforces escrow and payment flows on-chain through policy-driven smart contracts.

## Status

Early development — built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon/detail).

**Current phase:** Covenant + Treasury agents + approval flow (Phase 6)

## Monorepo

| Package | Description |
|---|---|
| `contracts/` | Rust + Odra smart contracts |
| `backend/` | Node.js + Fastify orchestrator and agents |
| `provider/` | x402 data provider — paid bank/ERP evidence API with on-chain payment verification |
| `shared/` | Shared TypeScript types and testnet config |
| `web/` | Next.js dashboard (frontend phase) |

## Quick start

```bash
cp .env.example .env
npm install
npm run build -w @covenantos/shared
npm run dev          # backend on :3001
npm run dev:provider  # x402 data provider on :3002
```

With Docker:

```bash
docker compose up --build
```

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

`ODRA_CASPER_LIVENET_EVENTS_URL` must point to a live SSE firehose (see `.env.example`). CSPR.cloud works with `CSPR_CLOUD_AUTH_TOKEN` from [console.cspr.build](https://console.cspr.build).

Backend chain status: `GET http://localhost:3001/chain/status`

Document extraction: `POST /facilities/extract` (multipart file upload). Requires `ANTHROPIC_API_KEY`; uses `ANTHROPIC_MODEL` (default `claude-haiku-4-5-20251001`).

x402 evidence: `POST /facilities/:id/evidence` — pays the data provider, records evidence, runs covenant evaluation, and may propose a hold action on breach.

Covenant check: `POST /facilities/:id/check` — re-evaluates the latest stored evidence.

Actions: `GET /actions`, `POST /actions/:id/approve` (auto-executes via Treasury when threshold met), `POST /actions/:id/execute`.

## Implementation phases

1. Monorepo scaffold + docker-compose + CI ✓
2. Odra contract trio + tests ✓
3. Testnet deploy + chain service ✓
4. Document Agent + golden-file tests ✓
5. x402 gateway + data provider ✓
6. Covenant + Treasury agents + approval flow ✓
7. Indexer + SSE
8. Security hardening, seed demo, README polish

## Stack

- **Smart contracts:** Rust + [Odra](https://odra.dev/)
- **Backend:** Node.js + TypeScript (Fastify)
- **Frontend:** Next.js (planned)
- **Chain:** Casper Testnet, casper-js-sdk, CSPR.cloud

## License

TBD
