#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile"
MANIFEST_DIR="$MOBILE_DIR/build"
MANIFEST_PATH="$MANIFEST_DIR/ios-release-manifest.json"
IOS_DIR="$MOBILE_DIR/ios"

MODE="xcode"
PROFILE="production"
CHECK_ONLY=0

usage() {
  cat <<'EOF'
Usage: ./scripts/release-ios.sh [--check-only] [--mode eas|xcode] [--profile <name>]

Options:
  --check-only      Run release preflight and write the manifest, but do not start a build.
  --mode            Build path to use. Defaults to "xcode". Use "eas" only when an Expo/EAS build is explicitly required.
  --profile         EAS profile to use when mode is "eas". Defaults to "production".
  -h, --help        Show this help message.
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
    fi
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check-only)
      CHECK_ONLY=1
      ;;
    --mode)
      shift
      MODE="${1:-}"
      ;;
    --profile)
      shift
      PROFILE="${1:-}"
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

[[ "$MODE" == "eas" || "$MODE" == "xcode" ]] || fail "--mode must be 'eas' or 'xcode'"
[[ -n "$PROFILE" ]] || fail "--profile requires a value"

BRANCH="$(run_git branch --show-current)"
[[ -n "$BRANCH" ]] || fail "detached HEAD is not allowed for release builds"
[[ "$BRANCH" == "main" || "$BRANCH" == release/* ]] || fail "release builds are only allowed from 'main' or 'release/*' branches (current: $BRANCH)"

STATUS_OUTPUT="$(run_git status --porcelain --untracked-files=normal)"
[[ -z "$STATUS_OUTPUT" ]] || fail "working tree must be completely clean before release"

UPSTREAM="$(run_git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
[[ -n "$UPSTREAM" ]] || fail "branch '$BRANCH' has no upstream tracking branch"
UPSTREAM_GIT_SHA="$(run_git rev-parse "$UPSTREAM")"

read -r AHEAD BEHIND < <(run_git rev-list --left-right --count "HEAD...$UPSTREAM")
[[ "$AHEAD" == "0" ]] || fail "branch '$BRANCH' has local-only commits that are not on $UPSTREAM"
[[ "$BEHIND" == "0" ]] || fail "branch '$BRANCH' is behind $UPSTREAM"

load_env_file "$MOBILE_DIR/.env.production"

export APP_ENV=production
export BRDG_GIT_BRANCH="$BRANCH"
export BRDG_GIT_SHA="$(run_git rev-parse HEAD)"
export BRDG_BUILD_DATE="${BRDG_BUILD_DATE:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"
export BRDG_RELEASE_MODE="$MODE"
export BRDG_RELEASE_PROFILE="$PROFILE"

DETECTED_APP_VERSION="$(detect_app_version)"
[[ -n "$DETECTED_APP_VERSION" ]] || fail "unable to resolve app version from mobile/package.json"
if [[ -n "${APP_VERSION:-}" && "$APP_VERSION" != "$DETECTED_APP_VERSION" ]]; then
  fail "APP_VERSION ($APP_VERSION) does not match mobile/package.json version ($DETECTED_APP_VERSION)"
fi
export APP_VERSION="${APP_VERSION:-$DETECTED_APP_VERSION}"
export IOS_BUILD_NUMBER="${IOS_BUILD_NUMBER:-}"
export IOS_BUNDLE_IDENTIFIER="${IOS_BUNDLE_IDENTIFIER:-}"
export IOS_DEVELOPMENT_TEAM="${IOS_DEVELOPMENT_TEAM:-$(detect_apple_team_id)}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-}"
export ASC_API_KEY_ID="${ASC_API_KEY_ID:-}"
export ASC_API_ISSUER_ID="${ASC_API_ISSUER_ID:-}"
export ASC_API_KEY_PATH="${ASC_API_KEY_PATH:-}"
export ASC_LIVE_BUILD_NUMBER="${ASC_LIVE_BUILD_NUMBER:-}"
export ASC_BUILD_NUMBER_VERIFIED_AT="${ASC_BUILD_NUMBER_VERIFIED_AT:-}"

[[ -n "$IOS_BUILD_NUMBER" ]] || fail "IOS_BUILD_NUMBER must be set before running a release"
[[ "$IOS_BUILD_NUMBER" =~ ^[0-9]+$ ]] || fail "IOS_BUILD_NUMBER must be numeric"
[[ -n "$IOS_BUNDLE_IDENTIFIER" ]] || fail "IOS_BUNDLE_IDENTIFIER must be set before running a release"
[[ -n "$EXPO_PUBLIC_API_URL" ]] || fail "EXPO_PUBLIC_API_URL must be set before running a release"
[[ -n "$ASC_LIVE_BUILD_NUMBER" ]] || fail "ASC_LIVE_BUILD_NUMBER must be set from live App Store Connect state before running a release"
[[ "$ASC_LIVE_BUILD_NUMBER" =~ ^[0-9]+$ ]] || fail "ASC_LIVE_BUILD_NUMBER must be numeric"
[[ -n "$ASC_BUILD_NUMBER_VERIFIED_AT" ]] || fail "ASC_BUILD_NUMBER_VERIFIED_AT must record when the live App Store Connect build number was checked"
(( IOS_BUILD_NUMBER > ASC_LIVE_BUILD_NUMBER )) || fail "IOS_BUILD_NUMBER ($IOS_BUILD_NUMBER) must be greater than the latest live App Store Connect build number ($ASC_LIVE_BUILD_NUMBER)"

AUTH_MODE="expo-eas"
if [[ "$MODE" == "xcode" ]]; then
  [[ -n "$IOS_DEVELOPMENT_TEAM" ]] || fail "IOS_DEVELOPMENT_TEAM is required for xcode releases when mobile/eas.json does not define submit.production.ios.appleTeamId"
  if [[ -n "$ASC_API_KEY_ID" || -n "$ASC_API_ISSUER_ID" || -n "$ASC_API_KEY_PATH" ]]; then
    [[ -n "$ASC_API_KEY_ID" ]] || fail "ASC_API_KEY_ID must be set when App Store Connect API key auth is used"
    [[ -n "$ASC_API_ISSUER_ID" ]] || fail "ASC_API_ISSUER_ID must be set when App Store Connect API key auth is used"
    ASC_API_KEY_PATH="${ASC_API_KEY_PATH:-$(detect_app_store_connect_key_path "$ASC_API_KEY_ID")}"
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

export UPSTREAM="$UPSTREAM"
export UPSTREAM_GIT_SHA="$UPSTREAM_GIT_SHA"
export AUTH_MODE="$AUTH_MODE"
export CHECK_ONLY

echo "release-ios: preflight summary"
echo "  branch: $BRANCH"
echo "  head sha: $BRDG_GIT_SHA"
echo "  upstream: $UPSTREAM ($UPSTREAM_GIT_SHA)"
echo "  version/build: $APP_VERSION ($IOS_BUILD_NUMBER)"
echo "  latest live ASC build: $ASC_LIVE_BUILD_NUMBER"
echo "  live ASC build verified at: $ASC_BUILD_NUMBER_VERIFIED_AT"
echo "  api url: $EXPO_PUBLIC_API_URL"
echo "  mode/profile: $MODE / $PROFILE"
echo "  auth mode: $AUTH_MODE"

echo "release-ios: running repo validation"
(
  cd "$ROOT_DIR"
  npm run check
)

mkdir -p "$MANIFEST_DIR"
python3 - <<'PY' "$MANIFEST_PATH"
import json
import os
import pathlib
import sys

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
    "authMode": os.environ["AUTH_MODE"],
    "appStoreConnectKeyId": os.environ.get("ASC_API_KEY_ID") or None,
    "appStoreConnectLiveBuildNumber": os.environ["ASC_LIVE_BUILD_NUMBER"],
    "appStoreConnectBuildNumberVerifiedAt": os.environ["ASC_BUILD_NUMBER_VERIFIED_AT"],
    "preflightOnly": os.environ["CHECK_ONLY"] == "1",
    "releaseEligibility": {
        "allowedBranch": True,
        "cleanTree": True,
        "hasUpstream": True,
        "aheadCount": 0,
        "behindCount": 0,
        "iosBuildNumberGreaterThanLiveAppStoreConnectBuild": True,
    },
}

pathlib.Path(sys.argv[1]).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
PY

echo "release-ios: manifest written to $MANIFEST_PATH"
echo "release-ios: branch=$BRANCH sha=$BRDG_GIT_SHA version=$APP_VERSION build=$IOS_BUILD_NUMBER api=$EXPO_PUBLIC_API_URL"

if [[ "$CHECK_ONLY" == "1" ]]; then
  exit 0
fi

case "$MODE" in
  eas)
    (
      cd "$MOBILE_DIR"
      run_eas build --platform ios --profile "$PROFILE"
    )
    ;;
  xcode)
    echo "release-ios: regenerating Expo iOS project"
    (
      cd "$MOBILE_DIR"
      npx expo prebuild --clean -p ios --npm
    )

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
    ;;
esac

# Tag the release commit so deploy-testflight workflow can trigger on it.
# Format: v{APP_VERSION}+{IOS_BUILD_NUMBER}
RELEASE_TAG="v${APP_VERSION}+${IOS_BUILD_NUMBER}"
if run_git rev-parse "$RELEASE_TAG" >/dev/null 2>&1; then
  fail "git tag '$RELEASE_TAG' already exists; do not reuse an existing release provenance tag"
fi
echo "release-ios: tagging release as $RELEASE_TAG"
run_git tag "$RELEASE_TAG"
