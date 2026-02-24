#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
MOBILE_DIR="$ROOT_DIR/mobile"

API_PORT="${API_PORT:-3000}"
API_BASE_URL="http://127.0.0.1:${API_PORT}"
BACKEND_LOG="${BACKEND_LOG:-/tmp/brdg-backend-smoke.log}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[1/5] Backend bootstrap (db up/wait/migrate/seed)"
(
  cd "$BACKEND_DIR"
  npm run dev:bootstrap
)

echo "[2/5] Start backend"
(
  cd "$BACKEND_DIR"
  npm run start:dev >"$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!

echo "[3/5] Wait for backend @ $API_BASE_URL"
for _ in {1..45}; do
  if curl -fsS "$API_BASE_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "$API_BASE_URL" >/dev/null 2>&1; then
  echo "Backend did not become ready. Last logs:" >&2
  tail -n 120 "$BACKEND_LOG" >&2 || true
  exit 1
fi

echo "[4/5] Mobile launch prerequisites"
(
  cd "$MOBILE_DIR"
  npx expo-doctor
  npm run typecheck
)

echo "[5/5] Smoke complete"
echo "Backend log: $BACKEND_LOG"
