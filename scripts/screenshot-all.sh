#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# BRDG — Automated Screenshot Runner
# ============================================================
# Boots backend, starts Expo on iOS Simulator, then runs
# Maestro flows to capture a screenshot of every screen.
#
# Usage:
#   ./scripts/screenshot-all.sh            # full run (backend + app + screenshots)
#   ./scripts/screenshot-all.sh --quick    # skip backend boot (assume it's running)
#
# Prerequisites:
#   - Docker (for Postgres + Redis)
#   - Xcode + iOS Simulator
#   - Maestro CLI  (curl -Ls https://get.maestro.mobile.dev | bash)
#   - Java runtime (brew install openjdk)
#
# Output: maestro/screenshots/*.png
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
MOBILE_DIR="$ROOT_DIR/mobile"
MAESTRO_DIR="$ROOT_DIR/maestro"
SCREENSHOT_DIR="$MAESTRO_DIR/screenshots"

export PATH="/opt/homebrew/opt/openjdk/bin:$HOME/.maestro/bin:$PATH"

API_PORT="${API_PORT:-${PORT:-3010}}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:${API_PORT}}"
BACKEND_LOG="/tmp/brdg-screenshot-backend.log"
EXPO_LOG="/tmp/brdg-screenshot-expo.log"
QUICK_MODE=false

for arg in "$@"; do
  case "$arg" in
    --quick) QUICK_MODE=true ;;
  esac
done

# ── Helpers ──────────────────────────────────────────────────

find_backend_listener() {
  lsof -tiTCP:"$API_PORT" -sTCP:LISTEN 2>/dev/null || true
}

kill_process_tree() {
  local parent_pid="$1"
  for child_pid in $(pgrep -P "$parent_pid" 2>/dev/null || true); do
    kill_process_tree "$child_pid"
  done
  if kill -0 "$parent_pid" 2>/dev/null; then
    kill "$parent_pid" 2>/dev/null || true
  fi
}

PIDS_TO_CLEAN=()
cleanup() {
  for pid in "${PIDS_TO_CLEAN[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill_process_tree "$pid"
      wait "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT

timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

# ── Preflight checks ────────────────────────────────────────

echo "$(timestamp) [preflight] Checking prerequisites..."

if ! command -v maestro &>/dev/null; then
  echo "ERROR: Maestro CLI not found. Install: curl -Ls https://get.maestro.mobile.dev | bash" >&2
  exit 1
fi

if ! command -v java &>/dev/null; then
  echo "ERROR: Java not found. Install: brew install openjdk" >&2
  exit 1
fi

if ! command -v xcrun &>/dev/null; then
  echo "ERROR: Xcode CLI tools not found." >&2
  exit 1
fi

# Clean previous screenshots
rm -rf "$SCREENSHOT_DIR"
mkdir -p "$SCREENSHOT_DIR"

# ── Step 1: Backend ─────────────────────────────────────────

if [ "$QUICK_MODE" = true ]; then
  echo "$(timestamp) [1/5] Quick mode — skipping backend boot"
  if ! curl -fsS "$API_BASE_URL" >/dev/null 2>&1; then
    echo "WARNING: Backend does not seem to be running at $API_BASE_URL" >&2
  fi
else
  EXISTING_PID="$(find_backend_listener)"
  if [[ -n "$EXISTING_PID" ]]; then
    echo "$(timestamp) [1/5] Backend already running on port $API_PORT (PID $EXISTING_PID)"
  else
    echo "$(timestamp) [1/5] Bootstrapping backend (docker + migrate + seed)..."
    (cd "$BACKEND_DIR" && npm run dev:bootstrap)

    echo "$(timestamp) [1/5] Starting backend..."
    (cd "$BACKEND_DIR" && npm run start:dev >"$BACKEND_LOG" 2>&1) &
    BACKEND_PID=$!
    PIDS_TO_CLEAN+=("$BACKEND_PID")

    echo "$(timestamp) [1/5] Waiting for backend at $API_BASE_URL..."
    READY=0
    for _ in {1..60}; do
      if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "Backend exited. Logs:" >&2
        tail -40 "$BACKEND_LOG" >&2
        exit 1
      fi
      if curl -fsS "$API_BASE_URL" >/dev/null 2>&1; then
        READY=1
        break
      fi
      sleep 1
    done
    if [[ "$READY" -ne 1 ]]; then
      echo "Backend did not start in time. Logs:" >&2
      tail -40 "$BACKEND_LOG" >&2
      exit 1
    fi
    echo "$(timestamp) [1/5] Backend ready."
  fi
fi

# ── Step 2: Reset preview scenario ──────────────────────────

echo "$(timestamp) [2/5] Resetting ui-preview scenario..."
(cd "$BACKEND_DIR" && npm run dev:scenario -- ui-preview)

# ── Step 3: iOS Simulator + Expo ─────────────────────────────

echo "$(timestamp) [3/5] Booting iOS Simulator..."

# Boot the default simulator if none is running
BOOTED_SIM=$(xcrun simctl list devices booted -j 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if d.get('state') == 'Booted':
            print(d['udid'])
            sys.exit(0)
" 2>/dev/null || true)

if [[ -z "$BOOTED_SIM" ]]; then
  # Find the latest iPhone simulator
  SIM_UDID=$(xcrun simctl list devices available -j | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime in sorted(data.get('devices', {}).keys(), reverse=True):
    if 'iOS' not in runtime:
        continue
    for d in data['devices'][runtime]:
        if 'iPhone' in d.get('name', '') and 'SE' not in d.get('name', ''):
            print(d['udid'])
            sys.exit(0)
# fallback to any iPhone
for runtime in sorted(data.get('devices', {}).keys(), reverse=True):
    if 'iOS' not in runtime:
        continue
    for d in data['devices'][runtime]:
        if 'iPhone' in d.get('name', ''):
            print(d['udid'])
            sys.exit(0)
" 2>/dev/null)

  if [[ -z "$SIM_UDID" ]]; then
    echo "ERROR: No iPhone simulator found" >&2
    exit 1
  fi
  xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
  echo "$(timestamp) [3/5] Booted simulator $SIM_UDID"
else
  echo "$(timestamp) [3/5] Simulator already booted: $BOOTED_SIM"
fi

open -a Simulator 2>/dev/null || true

echo "$(timestamp) [3/5] Starting Expo (iOS)..."
(cd "$MOBILE_DIR" && npx expo run:ios --no-install >"$EXPO_LOG" 2>&1) &
EXPO_PID=$!
PIDS_TO_CLEAN+=("$EXPO_PID")

# Wait for the app to install and launch
echo "$(timestamp) [3/5] Waiting for app to launch on simulator..."
APP_READY=0
for _ in {1..120}; do
  if xcrun simctl get_app_container booted com.avmillabs.brdg 2>/dev/null; then
    APP_READY=1
    break
  fi
  sleep 2
done

if [[ "$APP_READY" -ne 1 ]]; then
  echo "WARNING: Could not confirm app installed. Proceeding anyway..."
  echo "Expo log tail:" >&2
  tail -30 "$EXPO_LOG" >&2
fi

# Give the app a moment to fully render
sleep 5

# ── Step 4: Run Maestro screenshot flows ─────────────────────

echo "$(timestamp) [4/5] Running Maestro screenshot flows..."
cd "$MAESTRO_DIR"

MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true \
  maestro test screenshot-all.yaml 2>&1 | tee /tmp/brdg-maestro.log

MAESTRO_EXIT=${PIPESTATUS[0]}

# ── Step 5: Report ───────────────────────────────────────────

echo ""
echo "$(timestamp) [5/5] Screenshot results:"
echo "──────────────────────────────────────"

SCREENSHOT_COUNT=$(find "$SCREENSHOT_DIR" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
echo "  Screenshots captured: $SCREENSHOT_COUNT"
echo "  Output directory:     $SCREENSHOT_DIR"
echo ""

if [[ -d "$SCREENSHOT_DIR" ]]; then
  ls -la "$SCREENSHOT_DIR"/*.png 2>/dev/null || echo "  (no screenshots found)"
fi

echo ""
if [[ "$MAESTRO_EXIT" -eq 0 ]]; then
  echo "All screenshots captured successfully."
else
  echo "Maestro exited with code $MAESTRO_EXIT. Check /tmp/brdg-maestro.log for details."
fi

exit "$MAESTRO_EXIT"
