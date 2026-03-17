#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_CONFIG="$ROOT_DIR/mobile/app.config.ts"

usage() {
  echo "Usage: ./scripts/bump-version.sh <major|minor|patch>"
  exit 1
}

[[ $# -eq 1 ]] || usage

BUMP_TYPE="$1"
[[ "$BUMP_TYPE" == "major" || "$BUMP_TYPE" == "minor" || "$BUMP_TYPE" == "patch" ]] || usage

# Extract current version from the APP_VERSION default in app.config.ts
# Matches the pattern: process.env.APP_VERSION?.trim() || "x.y.z"
CURRENT_VERSION=$(grep -oP '\.APP_VERSION\?\.\s*trim\(\)\s*\|\|\s*"\K[0-9]+\.[0-9]+\.[0-9]+' "$APP_CONFIG" || true)

if [[ -z "$CURRENT_VERSION" ]]; then
  # Fallback: try a simpler grep for the default value
  CURRENT_VERSION=$(sed -n 's/.*APP_VERSION.*||.*"\([0-9]*\.[0-9]*\.[0-9]*\)".*/\1/p' "$APP_CONFIG")
fi

[[ -n "$CURRENT_VERSION" ]] || { echo "bump-version: could not read current version from $APP_CONFIG" >&2; exit 1; }

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

# Update the default value in app.config.ts
sed -i '' "s/\"${CURRENT_VERSION}\"/\"${NEW_VERSION}\"/" "$APP_CONFIG"

# Create a git tag
git -C "$ROOT_DIR" tag "v${NEW_VERSION}"

echo "$NEW_VERSION"
