# Distribution Guide

Portpourri ships through three channels:

1. **GitHub Releases** — signed and notarized `.app` zip (primary)
2. **Homebrew** — `brew install --cask jskoiz/portpourri/portpourri`
3. **Mac App Store** — sandboxed build (may have limitations)

---

## 1. GitHub Releases (automated)

### How it works

Push a version tag and the release workflow handles everything:

```bash
# Bump version in CHANGELOG.md, then:
git tag -a v0.2.0 -m "v0.2.0: Description"
git push origin v0.2.0
```

The `.github/workflows/release.yml` workflow will:
1. Build a release binary
2. Package the `.app` bundle with the tag version
3. Code sign with your Developer ID certificate
4. Notarize with Apple
5. Staple the notarization ticket
6. Zip and attach to the GitHub Release
7. Update the Homebrew cask formula

### Required GitHub Secrets

Set these in **Settings > Secrets and variables > Actions**:

| Secret | Value | How to get it |
|--------|-------|---------------|
| `DEVELOPER_ID_CERTIFICATE_P12` | Base64-encoded `.p12` file | Export from Keychain Access (see below) |
| `DEVELOPER_ID_CERTIFICATE_PASSWORD` | Password for the `.p12` | Set when exporting |
| `DEVELOPER_ID_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)` | `security find-identity -v -p codesigning` |
| `APPLE_ID` | Your Apple ID email | developer.apple.com |
| `APPLE_ID_PASSWORD` | App-specific password | appleid.apple.com > Sign-In and Security > App-Specific Passwords |
| `APPLE_TEAM_ID` | 10-character Team ID | developer.apple.com > Membership |
| `TAP_GITHUB_TOKEN` | GitHub PAT with repo scope | github.com > Settings > Developer settings > PATs |

### Exporting the Developer ID certificate

1. Open **Keychain Access**
2. Find **Developer ID Application: Your Name**
3. Right-click > **Export Items...**
4. Save as `.p12`, set a strong password
5. Base64 encode it:
   ```bash
   base64 -i Certificates.p12 | pbcopy
   ```
6. Paste as the `DEVELOPER_ID_CERTIFICATE_P12` secret

### Testing signing locally

```bash
# Find your signing identity
security find-identity -v -p codesigning

# Build and sign
swift build -c release --product PortpourriApp
./Scripts/package_app.sh

codesign --force --options runtime \
  --entitlements Entitlements/DevID.entitlements \
  --sign "Developer ID Application: Your Name (TEAMID)" \
  --timestamp \
  .build/Portpourri.app

# Verify
codesign --verify --deep --strict .build/Portpourri.app
spctl --assess --type execute .build/Portpourri.app
```

---

## 2. Homebrew Cask

### Setup (one-time)

1. Create a new GitHub repo: `jskoiz/homebrew-portpourri`
2. Create `Casks/portpourri.rb` (the release workflow updates this automatically)
3. Users install with:
   ```bash
   brew tap jskoiz/portpourri
   brew install --cask portpourri
   ```

### Initial cask formula

The release workflow auto-generates this, but for bootstrapping:

```ruby
cask "portpourri" do
  version "0.1.0"
  sha256 "FILL_AFTER_FIRST_RELEASE"

  url "https://github.com/jskoiz/portpourri/releases/download/v#{version}/Portpourri-#{version}-mac.zip"
  name "Portpourri"
  desc "macOS menu bar app for monitoring local dev port usage"
  homepage "https://github.com/jskoiz/portpourri"

  depends_on macos: ">= :sonoma"

  app "Portpourri.app"

  zap trash: [
    "~/Library/Preferences/dev.portpourri.app.plist",
  ]
end
```

---

## 3. Mac App Store

### Sandbox limitations

Portpourri uses `lsof` and `ps` to probe system state. The Mac App Store
requires App Sandbox, which restricts subprocess execution. This means:

- The app needs temporary exception entitlements
- Apple **may reject** the app during review
- If rejected, consider distributing only via GitHub + Homebrew

### If you want to try

1. Create an App ID at developer.apple.com with bundle ID `dev.portpourri.app`
2. Create a **Mac App Distribution** provisioning profile
3. Build with App Store entitlements:
   ```bash
   swift build -c release --product PortpourriApp

   codesign --force --options runtime \
     --entitlements Entitlements/AppStore.entitlements \
     --sign "3rd Party Mac Developer Application: Your Name (TEAMID)" \
     .build/release/PortpourriApp
   ```
4. Package as `.pkg`:
   ```bash
   productbuild --component .build/Portpourri.app /Applications \
     --sign "3rd Party Mac Developer Installer: Your Name (TEAMID)" \
     Portpourri.pkg
   ```
5. Upload via Transporter or:
   ```bash
   xcrun altool --upload-app -f Portpourri.pkg \
     -t macos -u "your@apple.id" -p "app-specific-password"
   ```

### Realistic assessment

For a utility that needs `lsof`/`ps` access, the App Store path is difficult.
Most similar macOS developer tools (iStat Menus, etc.) distribute outside the
App Store for exactly this reason. The GitHub Release + Homebrew combination
provides a great user experience without sandbox constraints.

---

## Version checklist

When releasing a new version:

1. Update `CHANGELOG.md` with the new version and changes
2. Commit: `git commit -m "Prepare v0.2.0 release"`
3. Tag: `git tag -a v0.2.0 -m "v0.2.0: Description"`
4. Push: `git push origin main --tags`
5. The release workflow handles the rest

The version flows automatically from the git tag into:
- `CFBundleShortVersionString` in Info.plist
- GitHub Release title
- Homebrew cask formula
