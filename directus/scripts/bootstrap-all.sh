#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose up -d

docker compose exec -T directus node /workspace/scripts/bootstrap-schema.mjs
docker compose exec -T directus node /workspace/scripts/seed-content.mjs
docker compose exec -T directus node /workspace/scripts/optimize-admin.mjs
docker compose exec -T directus node /workspace/scripts/setup-folders.mjs

echo "Directus bootstrap completed."
