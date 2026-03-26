#!/usr/bin/env bash
set -euo pipefail

# SSH tunnel: forward VPS Postgres (127.0.0.1:5432) → localhost:5433
# This replaces the local Docker Postgres with the production-like VPS database.
# Usage: npm run dev:tunnel   (keep running in a dedicated terminal)

HOST="brdg-vps"
REMOTE_PORT=5432
LOCAL_PORT=5433

echo "🔗 Opening SSH tunnel: VPS postgres → localhost:$LOCAL_PORT"
echo "   Remote: $HOST:$REMOTE_PORT → Local: 127.0.0.1:$LOCAL_PORT"
echo "   Press Ctrl+C to stop"
echo ""

exec ssh -N -L "$LOCAL_PORT:127.0.0.1:$REMOTE_PORT" "$HOST"
