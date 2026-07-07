#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example and fill secrets." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "Building and starting CovenantOS stack..."
docker compose -f infra/docker-compose.prod.yml up -d --build --remove-orphans

echo "Waiting for backend health..."
for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:3001/health >/dev/null; then
    echo "Backend healthy."
    break
  fi
  sleep 2
done

curl -sf -X POST http://127.0.0.1:3001/chain/bootstrap >/dev/null || true

curl -sf http://127.0.0.1:3001/health | head -c 200 || true
echo
docker compose -f infra/docker-compose.prod.yml ps
