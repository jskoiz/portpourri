#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile"
MANIFEST_DIR="$MOBILE_DIR/build"
MANIFEST_PATH="$MANIFEST_DIR/ios-release-manifest.json"
CONTEXT_PATH="$MANIFEST_DIR/ios-release-context.json"
IOS_DIR="$MOBILE_DIR/ios"

MODE="xcode"
PROFILE="production"
PHASE="full"
NATIVE_MODE="auto"
DRY_RUN_BUILD_NUMBER=0
SKIP_REPO_VALIDATION=0
WAIT_TIMEOUT_SECONDS=900
WAIT_INTERVAL_SECONDS=15

usage() {
  cat <<'EOF'
Usage: ./scripts/release-ios.sh [--phase prepare|ship|full] [--mode eas|xcode] [--profile <name>] [--native-mode auto|clean|reuse] [--dry-run-build-number] [--skip-repo-validation]

Options:
  --phase                 Release phase to run. Defaults to "full".
  --check-only            Backwards-compatible alias for --phase prepare.
  --mode                  Build path to use. Defaults to "xcode". Use "eas" only when an Expo/EAS build is explicitly required.
  --profile               EAS profile to use when mode is "eas". Defaults to "production".
  --native-mode           Native prep mode. Defaults to "auto".
  --dry-run-build-number  Allow prepare to use synthetic build-number metadata for CI validation.
  --skip-repo-validation  Skip repo validation during CI dry-run prepares that already ran the same checks upstream.
  --wait-timeout-seconds  App Store Connect processing wait timeout. Defaults to 900.
  --wait-interval-seconds App Store Connect polling interval. Defaults to 15.
  -h, --help              Show this help message.
EOF
}

fail() {
  echo "release-ios: $*" >&2
  exit 1
}

run_git() {
  git -C "$ROOT_DIR" "$@"
}

run_eas() {
  npx -y eas-cli "$@"
}

set_env_source() {
  local name="$1"
  local value="$2"
  export "BRDG_ENV_SOURCE_${name}=$value"
}

get_env_source() {
  local name="$1"
  local source_var="BRDG_ENV_SOURCE_${name}"
  printf '%s' "${!source_var:-unset}"
}

set_if_unset() {
  local name="$1"
  local value="$2"
  local source="$3"
  if [[ -z "${!name:-}" && -n "$value" ]]; then
    export "$name=$value"
    set_env_source "$name" "$source"
  fi
}

detect_apple_team_id() {
  node -e '
    const fs = require("fs");
    const path = require("path");
    const easPath = path.join(process.argv[1], "eas.json");
    try {
      const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));
      const teamId = eas?.submit?.production?.ios?.appleTeamId ?? "";
      process.stdout.write(teamId.trim());
    } catch {
      process.stdout.write("");
    }
  ' "$MOBILE_DIR"
}

detect_app_version() {
  node -e '
    const fs = require("fs");
    const path = require("path");
    const pkgPath = path.join(process.argv[1], "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      process.stdout.write(String(pkg.version ?? "").trim());
    } catch {
      process.stdout.write("");
    }
  ' "$MOBILE_DIR"
}

detect_app_store_connect_key_path() {
  local key_id="$1"
  local candidate
  local candidates=(
    "$ROOT_DIR/private_keys/AuthKey_${key_id}.p8"
    "$HOME/private_keys/AuthKey_${key_id}.p8"
    "$HOME/.private_keys/AuthKey_${key_id}.p8"
    "$HOME/.appstoreconnect/private_keys/AuthKey_${key_id}.p8"
  )

  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      echo "$candidate"
      return
    fi
  done
}

detect_xcode_container() {
  local workspace_path
  workspace_path="$(
    find "$IOS_DIR" -maxdepth 1 -type d -name '*.xcworkspace' ! -name 'project.xcworkspace' | sort | head -n 1
  )"

  if [[ -n "$workspace_path" ]]; then
    echo "workspace:$workspace_path"
    return
  fi

  local project_path
  project_path="$(
    find "$IOS_DIR" -maxdepth 1 -type d -name '*.xcodeproj' | sort | head -n 1
  )"

  if [[ -n "$project_path" ]]; then
    echo "project:$project_path"
    return
  fi

  fail "unable to locate Xcode project or workspace under $IOS_DIR"
}

detect_xcode_scheme() {
  local container_path="$1"
  local container_name
  container_name="$(basename "$container_path")"
  echo "${container_name%.*}"
}

load_env_file() {
  local env_file="$1"
  local tracked_var
  local tracked_vars=(
    APP_ENV
    APP_VERSION
    EXPO_PUBLIC_APP_NAME
    EXPO_PUBLIC_APP_SLUG
    EXPO_PUBLIC_API_URL
    IOS_BUNDLE_IDENTIFIER
    IOS_BUILD_NUMBER
    ANDROID_PACKAGE
    ANDROID_VERSION_CODE
    IOS_DEVELOPMENT_TEAM
    ASC_API_KEY_ID
    ASC_API_ISSUER_ID
    ASC_API_KEY_PATH
    ASC_LIVE_BUILD_NUMBER
    ASC_BUILD_NUMBER_VERIFIED_AT
    EAS_PROJECT_ID
    SENTRY_ORG
    SENTRY_PROJECT
    SENTRY_AUTH_TOKEN
    SENTRY_ALLOW_FAILURE
    SENTRY_DISABLE_AUTO_UPLOAD
    BRDG_BUILD_DATE
  )
  local existing_var_name

  if [[ ! -f "$env_file" ]]; then
    return
  fi

  for tracked_var in "${tracked_vars[@]}"; do
    if [[ -n "${!tracked_var+x}" ]]; then
      existing_var_name="BRDG_ENV_PRESET_${tracked_var}"
      printf -v "$existing_var_name" '%s' "${!tracked_var}"
      set_env_source "$tracked_var" "environment"
    fi
  done

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a

  for tracked_var in "${tracked_vars[@]}"; do
    existing_var_name="BRDG_ENV_PRESET_${tracked_var}"
    if [[ -n "${!existing_var_name+x}" ]]; then
      export "$tracked_var=${!existing_var_name}"
      unset "$existing_var_name"
    elif [[ -n "${!tracked_var+x}" ]]; then
      set_env_source "$tracked_var" "$env_file"
    fi
  done
}

json_field() {
  local json="$1"
  local field="$2"
  node -e '
    const payload = JSON.parse(process.argv[1]);
    const path = process.argv[2].split(".");
    let value = payload;
    for (const segment of path) {
      value = value?.[segment];
    }
    if (value === undefined || value === null) {
      process.exit(1);
    }
    process.stdout.write(String(value));
  ' "$json" "$field"
}

resolve_asc_live_state() {
  local asc_json

  if [[ "$DRY_RUN_BUILD_NUMBER" == "1" ]]; then
    set_if_unset "ASC_LIVE_BUILD_NUMBER" "${ASC_LIVE_BUILD_NUMBER:-0}" "dry-run"
    set_if_unset "ASC_BUILD_NUMBER_VERIFIED_AT" "${ASC_BUILD_NUMBER_VERIFIED_AT:-$BRDG_BUILD_DATE}" "dry-run"
    return
  fi

  if [[ -n "${ASC_LIVE_BUILD_NUMBER:-}" && -n "${ASC_BUILD_NUMBER_VERIFIED_AT:-}" ]]; then
    return
  fi

  if [[ "$AUTH_MODE" != "app-store-connect-api-key" ]]; then
    [[ -n "${ASC_LIVE_BUILD_NUMBER:-}" ]] || fail "ASC_LIVE_BUILD_NUMBER must be set from live App Store Connect state before running a release"
    [[ -n "${ASC_BUILD_NUMBER_VERIFIED_AT:-}" ]] || fail "ASC_BUILD_NUMBER_VERIFIED_AT must record when the live App Store Connect build number was checked"
    return
  fi

  asc_json="$(
    node "$ROOT_DIR/scripts/app-store-connect-build.mjs" latest-build --bundle-id "$IOS_BUNDLE_IDENTIFIER"
  )"
  set_if_unset "ASC_LIVE_BUILD_NUMBER" "$(json_field "$asc_json" latestBuild.buildNumber 2>/dev/null || true)" "app-store-connect-api"
  set_if_unset "ASC_BUILD_NUMBER_VERIFIED_AT" "$BRDG_BUILD_DATE" "app-store-connect-api"

  [[ -n "${ASC_LIVE_BUILD_NUMBER:-}" ]] || fail "unable to resolve the latest live App Store Connect build number"
}

resolve_ios_build_number() {
  local next_build_json

  if [[ "$DRY_RUN_BUILD_NUMBER" == "1" ]]; then
    set_if_unset "IOS_BUILD_NUMBER" "$(( ASC_LIVE_BUILD_NUMBER + 1 ))" "dry-run"
    return
  fi

  if [[ -n "${IOS_BUILD_NUMBER:-}" ]]; then
    return
  fi

  if [[ "$AUTH_MODE" != "app-store-connect-api-key" ]]; then
    fail "IOS_BUILD_NUMBER must be set before running a release when App Store Connect automation is unavailable"
  fi

  next_build_json="$(
    node "$ROOT_DIR/scripts/app-store-connect-build.mjs" next-build --bundle-id "$IOS_BUNDLE_IDENTIFIER"
  )"
  set_if_unset "IOS_BUILD_NUMBER" "$(json_field "$next_build_json" nextBuildNumber)" "app-store-connect-api"
}

resolve_native_prep_from_context() {
  [[ -f "$CONTEXT_PATH" ]] || fail "ship phase requires $CONTEXT_PATH from a successful prepare run"

  local context_json
  context_json="$(cat "$CONTEXT_PATH")"

  export CONTEXT_NATIVE_PREP="$(json_field "$context_json" nativePrep)"
  export CONTEXT_GIT_SHA="$(json_field "$context_json" gitSha)"
  export CONTEXT_BRANCH="$(json_field "$context_json" branch)"
  export CONTEXT_APP_VERSION="$(json_field "$context_json" appVersion)"
  export CONTEXT_IOS_BUILD_NUMBER="$(json_field "$context_json" iosBuildNumber)"
  export CONTEXT_API_BASE_URL="$(json_field "$context_json" apiBaseUrl)"
  export CONTEXT_MODE="$(json_field "$context_json" mode)"
  export CONTEXT_PROFILE="$(json_field "$context_json" profile)"

  [[ "$CONTEXT_GIT_SHA" == "$BRDG_GIT_SHA" ]] || fail "prepared context git SHA ($CONTEXT_GIT_SHA) does not match current HEAD ($BRDG_GIT_SHA)"
  [[ "$CONTEXT_BRANCH" == "$BRANCH" ]] || fail "prepared context branch ($CONTEXT_BRANCH) does not match current branch ($BRANCH)"
  [[ "$CONTEXT_APP_VERSION" == "$APP_VERSION" ]] || fail "prepared context app version ($CONTEXT_APP_VERSION) does not match current app version ($APP_VERSION)"
  [[ "$CONTEXT_IOS_BUILD_NUMBER" == "$IOS_BUILD_NUMBER" ]] || fail "prepared context build number ($CONTEXT_IOS_BUILD_NUMBER) does not match current build number ($IOS_BUILD_NUMBER)"
  [[ "$CONTEXT_API_BASE_URL" == "$EXPO_PUBLIC_API_URL" ]] || fail "prepared context API URL ($CONTEXT_API_BASE_URL) does not match current API URL ($EXPO_PUBLIC_API_URL)"
  [[ "$CONTEXT_MODE" == "$MODE" ]] || fail "prepared context mode ($CONTEXT_MODE) does not match current mode ($MODE)"
  [[ "$CONTEXT_PROFILE" == "$PROFILE" ]] || fail "prepared context profile ($CONTEXT_PROFILE) does not match current profile ($PROFILE)"

  if [[ "$NATIVE_MODE" == "auto" ]]; then
    export NATIVE_PREP="$CONTEXT_NATIVE_PREP"
  else
    case "$NATIVE_MODE" in
      clean)
        [[ "$CONTEXT_NATIVE_PREP" == "clean-prebuild" ]] || fail "prepared context native prep ($CONTEXT_NATIVE_PREP) does not match explicit --native-mode clean"
        export NATIVE_PREP="clean-prebuild"
        ;;
      reuse)
        [[ "$CONTEXT_NATIVE_PREP" == "reuse-existing-ios" ]] || fail "prepared context native prep ($CONTEXT_NATIVE_PREP) does not match explicit --native-mode reuse"
        export NATIVE_PREP="reuse-existing-ios"
        ;;
      *)
        fail "--native-mode must be auto, clean, or reuse"
        ;;
    esac
  fi

  export NATIVE_PREP_REASON="prepared context"
  export NATIVE_PREP_BASE_REF="$(json_field "$context_json" nativePrepBaseRef 2>/dev/null || true)"
}

resolve_native_prep() {
  local fast_path_json

  case "$NATIVE_MODE" in
    clean)
      export NATIVE_PREP="clean-prebuild"
      export NATIVE_PREP_REASON="explicit --native-mode clean"
      export NATIVE_PREP_BASE_REF=""
      ;;
    reuse)
      export NATIVE_PREP="reuse-existing-ios"
      export NATIVE_PREP_REASON="explicit --native-mode reuse"
      export NATIVE_PREP_BASE_REF=""
      ;;
    auto)
      # Repo policy expects an explicit helper reference: ./scripts/release-ios-fast-path.mjs
      fast_path_json="$(
        cd "$ROOT_DIR" && node ./scripts/release-ios-fast-path.mjs classify --cwd "$ROOT_DIR"
      )"
      export NATIVE_PREP="$(json_field "$fast_path_json" nativePrep)"
      export NATIVE_PREP_REASON="$(json_field "$fast_path_json" reason)"
      export NATIVE_PREP_BASE_REF="$(json_field "$fast_path_json" baseRef 2>/dev/null || true)"
      ;;
    *)
      fail "--native-mode must be auto, clean, or reuse"
      ;;
  esac
}

write_release_metadata() {
  local preflight_only="$1"

  mkdir -p "$MANIFEST_DIR"
  python3 - <<'PY' "$MANIFEST_PATH" "$CONTEXT_PATH" "$preflight_only"
import json
import os
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
context_path = pathlib.Path(sys.argv[2])
preflight_only = sys.argv[3] == "1"

env_sources = {
    "appVersion": os.environ.get("BRDG_ENV_SOURCE_APP_VERSION", "detected"),
    "iosBuildNumber": os.environ.get("BRDG_ENV_SOURCE_IOS_BUILD_NUMBER", "unset"),
    "iosBundleIdentifier": os.environ.get("BRDG_ENV_SOURCE_IOS_BUNDLE_IDENTIFIER", "unset"),
    "apiBaseUrl": os.environ.get("BRDG_ENV_SOURCE_EXPO_PUBLIC_API_URL", "unset"),
    "appleDevelopmentTeam": os.environ.get("BRDG_ENV_SOURCE_IOS_DEVELOPMENT_TEAM", "detected"),
    "appStoreConnectLiveBuildNumber": os.environ.get("BRDG_ENV_SOURCE_ASC_LIVE_BUILD_NUMBER", "unset"),
    "appStoreConnectBuildNumberVerifiedAt": os.environ.get("BRDG_ENV_SOURCE_ASC_BUILD_NUMBER_VERIFIED_AT", "unset"),
}

manifest = {
    "branch": os.environ["BRDG_GIT_BRANCH"],
    "upstream": os.environ["UPSTREAM"],
    "upstreamGitSha": os.environ["UPSTREAM_GIT_SHA"],
    "gitSha": os.environ["BRDG_GIT_SHA"],
    "appVersion": os.environ["APP_VERSION"],
    "iosBuildNumber": os.environ["IOS_BUILD_NUMBER"],
    "iosBundleIdentifier": os.environ["IOS_BUNDLE_IDENTIFIER"],
    "apiBaseUrl": os.environ["EXPO_PUBLIC_API_URL"],
    "buildDate": os.environ["BRDG_BUILD_DATE"],
    "mode": os.environ["BRDG_RELEASE_MODE"],
    "profile": os.environ["BRDG_RELEASE_PROFILE"],
    "phase": os.environ["BRDG_RELEASE_PHASE"],
    "authMode": os.environ["AUTH_MODE"],
    "appStoreConnectKeyId": os.environ.get("ASC_API_KEY_ID") or None,
    "appStoreConnectLiveBuildNumber": os.environ["ASC_LIVE_BUILD_NUMBER"],
    "appStoreConnectBuildNumberVerifiedAt": os.environ["ASC_BUILD_NUMBER_VERIFIED_AT"],
    "nativePrep": os.environ["NATIVE_PREP"],
    "nativePrepReason": os.environ.get("NATIVE_PREP_REASON") or None,
    "nativePrepBaseRef": os.environ.get("NATIVE_PREP_BASE_REF") or None,
    "preflightOnly": preflight_only,
    "releaseEligibility": {
        "allowedBranch": True,
        "cleanTree": True,
        "hasUpstream": True,
        "aheadCount": 0,
        "behindCount": 0,
        "iosBuildNumberGreaterThanLiveAppStoreConnectBuild": int(os.environ["IOS_BUILD_NUMBER"]) > int(os.environ["ASC_LIVE_BUILD_NUMBER"]),
    },
    "envSources": env_sources,
}

context = {
    "preparedAt": os.environ["BRDG_BUILD_DATE"],
    "branch": os.environ["BRDG_GIT_BRANCH"],
    "upstream": os.environ["UPSTREAM"],
    "upstreamGitSha": os.environ["UPSTREAM_GIT_SHA"],
    "gitSha": os.environ["BRDG_GIT_SHA"],
    "appVersion": os.environ["APP_VERSION"],
    "iosBuildNumber": os.environ["IOS_BUILD_NUMBER"],
    "iosBundleIdentifier": os.environ["IOS_BUNDLE_IDENTIFIER"],
    "apiBaseUrl": os.environ["EXPO_PUBLIC_API_URL"],
    "mode": os.environ["BRDG_RELEASE_MODE"],
    "profile": os.environ["BRDG_RELEASE_PROFILE"],
    "authMode": os.environ["AUTH_MODE"],
    "appStoreConnectLiveBuildNumber": os.environ["ASC_LIVE_BUILD_NUMBER"],
    "appStoreConnectBuildNumberVerifiedAt": os.environ["ASC_BUILD_NUMBER_VERIFIED_AT"],
    "nativePrep": os.environ["NATIVE_PREP"],
    "nativePrepReason": os.environ.get("NATIVE_PREP_REASON") or None,
    "nativePrepBaseRef": os.environ.get("NATIVE_PREP_BASE_REF") or None,
    "envSources": env_sources,
}

manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
context_path.write_text(json.dumps(context, indent=2) + "\n", encoding="utf-8")
PY
}

run_repo_validation() {
  echo "release-ios: running repo validation"
  (
    cd "$ROOT_DIR"
    env \
      -u APP_VERSION \
      -u IOS_BUILD_NUMBER \
      -u IOS_BUNDLE_IDENTIFIER \
      -u ASC_LIVE_BUILD_NUMBER \
      -u ASC_BUILD_NUMBER_VERIFIED_AT \
      -u ASC_API_KEY_ID \
      -u ASC_API_ISSUER_ID \
      -u ASC_API_KEY_PATH \
      -u IOS_DEVELOPMENT_TEAM \
      -u BRDG_BUILD_DATE \
      -u BRDG_RELEASE_MODE \
      -u BRDG_RELEASE_PROFILE \
      -u BRDG_RELEASE_PHASE \
      -u AUTH_MODE \
      -u NATIVE_PREP \
      -u NATIVE_PREP_REASON \
      -u NATIVE_PREP_BASE_REF \
      npm run check
  )
}

print_preflight_summary() {
  echo "release-ios: preflight summary"
  echo "  phase: $PHASE"
  echo "  branch: $BRANCH"
  echo "  head sha: $BRDG_GIT_SHA"
  echo "  upstream: $UPSTREAM ($UPSTREAM_GIT_SHA)"
  echo "  version/build: $APP_VERSION ($IOS_BUILD_NUMBER)"
  echo "  latest live ASC build: $ASC_LIVE_BUILD_NUMBER"
  echo "  live ASC build verified at: $ASC_BUILD_NUMBER_VERIFIED_AT"
  echo "  api url: $EXPO_PUBLIC_API_URL"
  echo "  mode/profile: $MODE / $PROFILE"
  echo "  auth mode: $AUTH_MODE"
  echo "  native prep: $NATIVE_PREP"
  echo "  native prep reason: $NATIVE_PREP_REASON"
  if [[ -n "$NATIVE_PREP_BASE_REF" ]]; then
    echo "  native prep base ref: $NATIVE_PREP_BASE_REF"
  fi
  echo "  env sources:"
  echo "    IOS_BUILD_NUMBER: $(get_env_source IOS_BUILD_NUMBER)"
  echo "    IOS_BUNDLE_IDENTIFIER: $(get_env_source IOS_BUNDLE_IDENTIFIER)"
  echo "    EXPO_PUBLIC_API_URL: $(get_env_source EXPO_PUBLIC_API_URL)"
  echo "    IOS_DEVELOPMENT_TEAM: $(get_env_source IOS_DEVELOPMENT_TEAM)"
  echo "    ASC_LIVE_BUILD_NUMBER: $(get_env_source ASC_LIVE_BUILD_NUMBER)"
  echo "    ASC_BUILD_NUMBER_VERIFIED_AT: $(get_env_source ASC_BUILD_NUMBER_VERIFIED_AT)"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check-only)
      PHASE="prepare"
      ;;
    --phase)
      shift
      PHASE="${1:-}"
      ;;
    --mode)
      shift
      MODE="${1:-}"
      ;;
    --profile)
      shift
      PROFILE="${1:-}"
      ;;
    --native-mode)
      shift
      NATIVE_MODE="${1:-}"
      ;;
    --dry-run-build-number)
      DRY_RUN_BUILD_NUMBER=1
      ;;
    --skip-repo-validation)
      SKIP_REPO_VALIDATION=1
      ;;
    --wait-timeout-seconds)
      shift
      WAIT_TIMEOUT_SECONDS="${1:-}"
      ;;
    --wait-interval-seconds)
      shift
      WAIT_INTERVAL_SECONDS="${1:-}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
  shift
done

[[ "$PHASE" == "prepare" || "$PHASE" == "ship" || "$PHASE" == "full" ]] || fail "--phase must be prepare, ship, or full"
[[ "$MODE" == "eas" || "$MODE" == "xcode" ]] || fail "--mode must be 'eas' or 'xcode'"
[[ -n "$PROFILE" ]] || fail "--profile requires a value"
[[ "$WAIT_TIMEOUT_SECONDS" =~ ^[0-9]+$ ]] || fail "--wait-timeout-seconds must be numeric"
[[ "$WAIT_INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || fail "--wait-interval-seconds must be numeric"

CI_RELEASE_DRY_RUN=0
if [[ "$PHASE" == "prepare" && "$DRY_RUN_BUILD_NUMBER" == "1" && "${GITHUB_ACTIONS:-}" == "true" ]]; then
  CI_RELEASE_DRY_RUN=1
fi

if [[ "$SKIP_REPO_VALIDATION" == "1" && "$CI_RELEASE_DRY_RUN" != "1" ]]; then
  fail "--skip-repo-validation is only allowed for GitHub Actions prepare dry-runs"
fi

BRANCH="$(run_git branch --show-current)"
if [[ -z "$BRANCH" && "$CI_RELEASE_DRY_RUN" == "1" ]]; then
  BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}"
fi
[[ -n "$BRANCH" ]] || fail "detached HEAD is not allowed for release builds"
if [[ "$CI_RELEASE_DRY_RUN" != "1" ]]; then
  [[ "$BRANCH" == "main" || "$BRANCH" == release/* ]] || fail "release builds are only allowed from 'main' or 'release/*' branches (current: $BRANCH)"
fi

STATUS_OUTPUT="$(run_git status --porcelain --untracked-files=normal)"
[[ -z "$STATUS_OUTPUT" ]] || fail "working tree must be completely clean before release"

UPSTREAM=""
UPSTREAM_GIT_SHA=""
if [[ "$CI_RELEASE_DRY_RUN" != "1" ]]; then
  UPSTREAM="$(run_git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
  [[ -n "$UPSTREAM" ]] || fail "branch '$BRANCH' has no upstream tracking branch"
  UPSTREAM_GIT_SHA="$(run_git rev-parse "$UPSTREAM")"

  read -r AHEAD BEHIND < <(run_git rev-list --left-right --count "HEAD...$UPSTREAM")
  [[ "$AHEAD" == "0" ]] || fail "branch '$BRANCH' has local-only commits that are not on $UPSTREAM"
  [[ "$BEHIND" == "0" ]] || fail "branch '$BRANCH' is behind $UPSTREAM"
fi

load_env_file "$MOBILE_DIR/.env.production"

export APP_ENV=production
export BRDG_GIT_BRANCH="$BRANCH"
export BRDG_GIT_SHA="$(run_git rev-parse HEAD)"
export BRDG_BUILD_DATE="${BRDG_BUILD_DATE:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"
export BRDG_RELEASE_MODE="$MODE"
export BRDG_RELEASE_PROFILE="$PROFILE"
export BRDG_RELEASE_PHASE="$PHASE"

DETECTED_APP_VERSION="$(detect_app_version)"
[[ -n "$DETECTED_APP_VERSION" ]] || fail "unable to resolve app version from mobile/package.json"
if [[ -n "${APP_VERSION:-}" && "$APP_VERSION" != "$DETECTED_APP_VERSION" ]]; then
  fail "APP_VERSION ($APP_VERSION) does not match mobile/package.json version ($DETECTED_APP_VERSION)"
fi
set_if_unset "APP_VERSION" "$DETECTED_APP_VERSION" "mobile/package.json"

export IOS_BUILD_NUMBER="${IOS_BUILD_NUMBER:-}"
export IOS_BUNDLE_IDENTIFIER="${IOS_BUNDLE_IDENTIFIER:-}"
export IOS_DEVELOPMENT_TEAM="${IOS_DEVELOPMENT_TEAM:-}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-}"
export ASC_API_KEY_ID="${ASC_API_KEY_ID:-}"
export ASC_API_ISSUER_ID="${ASC_API_ISSUER_ID:-}"
export ASC_API_KEY_PATH="${ASC_API_KEY_PATH:-}"
export ASC_LIVE_BUILD_NUMBER="${ASC_LIVE_BUILD_NUMBER:-}"
export ASC_BUILD_NUMBER_VERIFIED_AT="${ASC_BUILD_NUMBER_VERIFIED_AT:-}"

set_if_unset "IOS_DEVELOPMENT_TEAM" "$(detect_apple_team_id)" "mobile/eas.json"

AUTH_MODE="expo-eas"
if [[ "$MODE" == "xcode" ]]; then
  [[ -n "$IOS_DEVELOPMENT_TEAM" ]] || fail "IOS_DEVELOPMENT_TEAM is required for xcode releases when mobile/eas.json does not define submit.production.ios.appleTeamId"
  if [[ -n "$ASC_API_KEY_ID" || -n "$ASC_API_ISSUER_ID" || -n "$ASC_API_KEY_PATH" ]]; then
    [[ -n "$ASC_API_KEY_ID" ]] || fail "ASC_API_KEY_ID must be set when App Store Connect API key auth is used"
    [[ -n "$ASC_API_ISSUER_ID" ]] || fail "ASC_API_ISSUER_ID must be set when App Store Connect API key auth is used"
    set_if_unset "ASC_API_KEY_PATH" "$(detect_app_store_connect_key_path "$ASC_API_KEY_ID")" "auto-discovered"
    [[ -n "$ASC_API_KEY_PATH" ]] || fail "unable to locate AuthKey_${ASC_API_KEY_ID}.p8; set ASC_API_KEY_PATH to the App Store Connect private key file"
    [[ -f "$ASC_API_KEY_PATH" ]] || fail "ASC_API_KEY_PATH does not exist: $ASC_API_KEY_PATH"
    AUTH_MODE="app-store-connect-api-key"
  else
    AUTH_MODE="xcode-account"
  fi
  if [[ -z "${SENTRY_ALLOW_FAILURE:-}" && ( -z "${SENTRY_ORG:-}" || -z "${SENTRY_PROJECT:-}" || -z "${SENTRY_AUTH_TOKEN:-}" ) ]]; then
    export SENTRY_ALLOW_FAILURE=true
  fi
  if [[ -z "${SENTRY_DISABLE_AUTO_UPLOAD:-}" ]]; then
    export SENTRY_DISABLE_AUTO_UPLOAD=true
  fi
fi

resolve_asc_live_state
[[ -n "$ASC_LIVE_BUILD_NUMBER" ]] || fail "ASC_LIVE_BUILD_NUMBER must be set before running a release"
[[ "$ASC_LIVE_BUILD_NUMBER" =~ ^[0-9]+$ ]] || fail "ASC_LIVE_BUILD_NUMBER must be numeric"
[[ -n "$ASC_BUILD_NUMBER_VERIFIED_AT" ]] || fail "ASC_BUILD_NUMBER_VERIFIED_AT must record when the live App Store Connect build number was checked"

resolve_ios_build_number
[[ -n "$IOS_BUILD_NUMBER" ]] || fail "IOS_BUILD_NUMBER must be set before running a release"
[[ "$IOS_BUILD_NUMBER" =~ ^[0-9]+$ ]] || fail "IOS_BUILD_NUMBER must be numeric"
[[ -n "$IOS_BUNDLE_IDENTIFIER" ]] || fail "IOS_BUNDLE_IDENTIFIER must be set before running a release"
[[ -n "$EXPO_PUBLIC_API_URL" ]] || fail "EXPO_PUBLIC_API_URL must be set before running a release"
(( IOS_BUILD_NUMBER > ASC_LIVE_BUILD_NUMBER )) || fail "IOS_BUILD_NUMBER ($IOS_BUILD_NUMBER) must be greater than the latest live App Store Connect build number ($ASC_LIVE_BUILD_NUMBER)"

export UPSTREAM="$UPSTREAM"
export UPSTREAM_GIT_SHA="$UPSTREAM_GIT_SHA"
export AUTH_MODE="$AUTH_MODE"

if [[ "$PHASE" == "ship" ]]; then
  resolve_native_prep_from_context
else
  resolve_native_prep
fi

print_preflight_summary

if [[ "$PHASE" == "prepare" || "$PHASE" == "full" ]]; then
  if [[ "$SKIP_REPO_VALIDATION" == "1" ]]; then
    echo "release-ios: skipping repo validation because CI already ran the same checks upstream"
  else
    run_repo_validation
  fi
fi

if [[ "$PHASE" == "prepare" ]]; then
  write_release_metadata 1
  echo "release-ios: prepare context written to $CONTEXT_PATH"
  echo "release-ios: manifest written to $MANIFEST_PATH"
  exit 0
fi

if [[ "$PHASE" == "full" ]]; then
  write_release_metadata 0
else
  write_release_metadata 0
fi

echo "release-ios: manifest written to $MANIFEST_PATH"
echo "release-ios: context written to $CONTEXT_PATH"
echo "release-ios: branch=$BRANCH sha=$BRDG_GIT_SHA version=$APP_VERSION build=$IOS_BUILD_NUMBER api=$EXPO_PUBLIC_API_URL"

case "$MODE" in
  eas)
    (
      cd "$MOBILE_DIR"
      run_eas build --platform ios --profile "$PROFILE"
    )
    ;;
  xcode)
    if [[ "$NATIVE_PREP" == "clean-prebuild" || ! -d "$IOS_DIR" ]]; then
      echo "release-ios: regenerating Expo iOS project"
      (
        cd "$MOBILE_DIR"
        npx expo prebuild --clean -p ios --npm
      )
    else
      echo "release-ios: reusing existing iOS project"
    fi

    IFS=":" read -r XCODE_CONTAINER_KIND XCODE_CONTAINER_PATH <<<"$(detect_xcode_container)"
    XCODE_SCHEME="$(detect_xcode_scheme "$XCODE_CONTAINER_PATH")"
    ARCHIVE_PATH="$MOBILE_DIR/build/${XCODE_SCHEME}.xcarchive"
    EXPORT_PATH="$MOBILE_DIR/build/ios-export"
    EXPORT_OPTIONS_PATH="$MOBILE_DIR/build/ios-export-options.plist"
    XCODE_TARGET_ARGS=()
    XCODE_AUTH_ARGS=()

    if [[ "$XCODE_CONTAINER_KIND" == "workspace" ]]; then
      XCODE_TARGET_ARGS=(-workspace "$XCODE_CONTAINER_PATH")
    else
      XCODE_TARGET_ARGS=(-project "$XCODE_CONTAINER_PATH")
    fi

    if [[ -n "$ASC_API_KEY_ID" ]]; then
      XCODE_AUTH_ARGS=(
        -authenticationKeyPath "$ASC_API_KEY_PATH"
        -authenticationKeyID "$ASC_API_KEY_ID"
        -authenticationKeyIssuerID "$ASC_API_ISSUER_ID"
      )
    fi

    run_xcodebuild_with_auth() {
      if [[ -n "$ASC_API_KEY_ID" ]]; then
        xcodebuild "$@" "${XCODE_AUTH_ARGS[@]}" -allowProvisioningUpdates
      else
        xcodebuild "$@" -allowProvisioningUpdates
      fi
    }

    mkdir -p "$EXPORT_PATH"
    cat >"$EXPORT_OPTIONS_PATH" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>destination</key>
  <string>upload</string>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
  <key>method</key>
  <string>app-store-connect</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
EOF

    (
      cd "$MOBILE_DIR"
      run_xcodebuild_with_auth \
        "${XCODE_TARGET_ARGS[@]}" \
        -scheme "$XCODE_SCHEME" \
        -configuration Release \
        -destination 'generic/platform=iOS' \
        archive \
        -archivePath "$ARCHIVE_PATH" \
        PRODUCT_BUNDLE_IDENTIFIER="$IOS_BUNDLE_IDENTIFIER" \
        DEVELOPMENT_TEAM="$IOS_DEVELOPMENT_TEAM" \
        MARKETING_VERSION="$APP_VERSION" \
        CURRENT_PROJECT_VERSION="$IOS_BUILD_NUMBER"

      MAIN_BUNDLE_PATH="$ARCHIVE_PATH/Products/Applications/${XCODE_SCHEME}.app/main.jsbundle"
      [[ -f "$MAIN_BUNDLE_PATH" ]] || fail "archive is missing main.jsbundle at $MAIN_BUNDLE_PATH"

      run_xcodebuild_with_auth \
        -exportArchive \
        -archivePath "$ARCHIVE_PATH" \
        -exportPath "$EXPORT_PATH" \
        -exportOptionsPlist "$EXPORT_OPTIONS_PATH" \
        DEVELOPMENT_TEAM="$IOS_DEVELOPMENT_TEAM"
    )

    if [[ "$AUTH_MODE" == "app-store-connect-api-key" && "$DRY_RUN_BUILD_NUMBER" != "1" ]]; then
      echo "release-ios: waiting for App Store Connect to process build $IOS_BUILD_NUMBER"
      node "$ROOT_DIR/scripts/app-store-connect-build.mjs" wait-processing \
        --bundle-id "$IOS_BUNDLE_IDENTIFIER" \
        --build "$IOS_BUILD_NUMBER" \
        --timeout-seconds "$WAIT_TIMEOUT_SECONDS" \
        --interval-seconds "$WAIT_INTERVAL_SECONDS"
    else
      echo "release-ios: skipping App Store Connect processing wait because API-key automation is unavailable"
    fi
    ;;
esac

RELEASE_TAG="v${APP_VERSION}+${IOS_BUILD_NUMBER}"
if run_git rev-parse "$RELEASE_TAG" >/dev/null 2>&1; then
  fail "git tag '$RELEASE_TAG' already exists; do not reuse an existing release provenance tag"
fi
echo "release-ios: tagging release as $RELEASE_TAG"
run_git tag "$RELEASE_TAG"
