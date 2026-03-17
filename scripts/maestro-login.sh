#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Pre-login helper for Maestro screenshot automation
# ============================================================
# Calls the login API and injects the auth token into the
# iOS Simulator's app data so the app starts logged in.
# ============================================================

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3010}"
EMAIL="${1:-preview.lana@brdg.local}"
PASSWORD="${2:-PreviewPass123!}"

echo "Logging in as $EMAIL..."

RESPONSE=$(curl -sf -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: Failed to get token" >&2
  exit 1
fi

echo "Got token: ${TOKEN:0:20}..."

# Write token to the simulator's SecureStore via simctl keychain
# Expo SecureStore on iOS uses the Keychain with service = app bundle ID
BUNDLE_ID="com.avmillabs.brdg"
KEYCHAIN_KEY="brdg_access_token"

# Use simctl to add a keychain item
# Unfortunately simctl doesn't have direct keychain write support.
# Instead, we'll write to the app's NSUserDefaults as a fallback,
# or use a temp file the app can read.

# Alternative: write a small .plist that the app reads on startup
SIM_UDID=$(xcrun simctl list devices booted -j | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if d.get('state') == 'Booted':
            print(d['udid'])
            sys.exit(0)
")

if [[ -z "$SIM_UDID" ]]; then
  echo "ERROR: No booted simulator found" >&2
  exit 1
fi

# Write token to a file in the app's Documents directory
APP_DATA=$(xcrun simctl get_app_container booted "$BUNDLE_ID" data 2>/dev/null || true)
if [[ -n "$APP_DATA" ]]; then
  mkdir -p "$APP_DATA/Documents"
  echo "$TOKEN" > "$APP_DATA/Documents/.maestro-auth-token"
  echo "Token written to app Documents"
else
  echo "WARNING: Could not find app data container" >&2
fi

echo "$TOKEN"
