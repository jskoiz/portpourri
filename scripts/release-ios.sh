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

detect_xcode_container() {
  if [[ -d "$IOS_DIR/mobile.xcworkspace" ]]; then
    echo "workspace:$IOS_DIR/mobile.xcworkspace"
    return
  fi

  if [[ -d "$IOS_DIR/mobile.xcodeproj" ]]; then
    echo "project:$IOS_DIR/mobile.xcodeproj"
    return
  fi

  fail "unable to locate Xcode project or workspace under $IOS_DIR"
}

load_env_file() {
  local env_file="$1"

  if [[ ! -f "$env_file" ]]; then
    return
  fi

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
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

export APP_VERSION="${APP_VERSION:-1.0.0}"
export IOS_BUILD_NUMBER="${IOS_BUILD_NUMBER:-}"
export IOS_BUNDLE_IDENTIFIER="${IOS_BUNDLE_IDENTIFIER:-}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-}"

[[ -n "$IOS_BUILD_NUMBER" ]] || fail "IOS_BUILD_NUMBER must be set before running a release"
[[ -n "$IOS_BUNDLE_IDENTIFIER" ]] || fail "IOS_BUNDLE_IDENTIFIER must be set before running a release"
[[ -n "$EXPO_PUBLIC_API_URL" ]] || fail "EXPO_PUBLIC_API_URL must be set before running a release"

echo "release-ios: running repo validation"
(
  cd "$ROOT_DIR"
  npm run check
)

mkdir -p "$MANIFEST_DIR"
cat >"$MANIFEST_PATH" <<EOF
{
  "branch": "$BRANCH",
  "upstream": "$UPSTREAM",
  "gitSha": "$BRDG_GIT_SHA",
  "appVersion": "$APP_VERSION",
  "iosBuildNumber": "$IOS_BUILD_NUMBER",
  "iosBundleIdentifier": "$IOS_BUNDLE_IDENTIFIER",
  "apiBaseUrl": "$EXPO_PUBLIC_API_URL",
  "buildDate": "$BRDG_BUILD_DATE",
  "mode": "$MODE",
  "profile": "$PROFILE"
}
EOF

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
    IFS=":" read -r XCODE_CONTAINER_KIND XCODE_CONTAINER_PATH <<<"$(detect_xcode_container)"
    ARCHIVE_PATH="$MOBILE_DIR/build/BRDG.xcarchive"
    EXPORT_PATH="$MOBILE_DIR/build/ios-export"
    EXPORT_OPTIONS_PATH="$MOBILE_DIR/build/ios-export-options.plist"
    XCODE_TARGET_ARGS=()

    if [[ "$XCODE_CONTAINER_KIND" == "workspace" ]]; then
      XCODE_TARGET_ARGS=(-workspace "$XCODE_CONTAINER_PATH")
    else
      XCODE_TARGET_ARGS=(-project "$XCODE_CONTAINER_PATH")
    fi

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
      xcodebuild \
        "${XCODE_TARGET_ARGS[@]}" \
        -scheme mobile \
        -configuration Release \
        -destination 'generic/platform=iOS' \
        archive \
        -archivePath "$ARCHIVE_PATH" \
        PRODUCT_BUNDLE_IDENTIFIER="$IOS_BUNDLE_IDENTIFIER" \
        MARKETING_VERSION="$APP_VERSION" \
        CURRENT_PROJECT_VERSION="$IOS_BUILD_NUMBER" \
        -allowProvisioningUpdates

      xcodebuild \
        -exportArchive \
        -archivePath "$ARCHIVE_PATH" \
        -exportPath "$EXPORT_PATH" \
        -exportOptionsPlist "$EXPORT_OPTIONS_PATH" \
        -allowProvisioningUpdates
    )
    ;;
esac
