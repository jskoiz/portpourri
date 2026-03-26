#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
backend_dir="$repo_root/backend"
env_file="$backend_dir/.env.remote"

if [[ ! -f "$env_file" ]]; then
  echo "backend/.env.remote not found. Copy from backend/.env.example and adjust DATABASE_URL." >&2
  exit 1
fi

# Verify the tunnel is running (localhost:5433 should be open)
if ! nc -z 127.0.0.1 5433 2>/dev/null; then
  echo "⚠️  SSH tunnel not detected on localhost:5433" >&2
  echo "   Run 'npm run dev:tunnel' in another terminal first." >&2
  exit 1
fi

echo "✅ Tunnel detected on localhost:5433"
echo "🚀 Starting backend with .env.remote"

cd "$backend_dir"
set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

exec npm run start:dev
