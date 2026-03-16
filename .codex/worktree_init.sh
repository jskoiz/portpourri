#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

cd "$repo_root"

if [ -f backend/package-lock.json ]; then
  npm --prefix backend ci
fi

if [ -f mobile/package-lock.json ]; then
  npm --prefix mobile ci
fi

node ./scripts/generate-repo-index.mjs >/dev/null
