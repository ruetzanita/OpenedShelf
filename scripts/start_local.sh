#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "============================================================"
echo "📚 Starting OpenedShelf Local Deployment"
echo "============================================================"

export PORT="${PORT:-8787}"
export SEARCH_PORT="${SEARCH_PORT:-8788}"

exec node scripts/dev_server.mjs
