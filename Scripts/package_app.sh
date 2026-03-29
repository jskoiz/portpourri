#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/.build/release"
APP_DIR="$ROOT/.build/Portpourri.app"
MACOS_DIR="$APP_DIR/Contents/MacOS"
RESOURCES_DIR="$APP_DIR/Contents/Resources"

cd "$ROOT"
swift build -c release --product PortpourriApp

rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

cp "$BUILD_DIR/PortpourriApp" "$MACOS_DIR/PortpourriApp"

BUILD_TIMESTAMP="$(date -u '+%Y-%m-%d %H:%M UTC')"

cat > "$APP_DIR/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>PortpourriApp</string>
  <key>CFBundleIdentifier</key>
  <string>dev.portpourri.app</string>
  <key>CFBundleName</key>
  <string>Portpourri</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NWBuildTimestamp</key>
  <string>${BUILD_TIMESTAMP}</string>
</dict>
</plist>
PLIST

echo "Packaged $APP_DIR"
