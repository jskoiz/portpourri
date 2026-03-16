#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREE_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
COMMON_GIT_DIR="$(git -C "$WORKTREE_ROOT" rev-parse --git-common-dir)"
COMMON_ROOT="$(cd "$COMMON_GIT_DIR/.." && pwd)"
COMPOSE_FILE="$COMMON_ROOT/docker-compose.yml"
PROJECT_NAME="${BRDG_COMPOSE_PROJECT:-brdg}"

docker compose \
  --project-name "$PROJECT_NAME" \
  --project-directory "$COMMON_ROOT" \
  -f "$COMPOSE_FILE" \
  up -d postgres redis
