# Distribution Guide

Portpourri currently ships through two public channels:

1. **GitHub Releases** — signed and notarized `.app` zip (canonical)
2. **Homebrew** — `brew install --cask jskoiz/portpourri/portpourri` (secondary convenience path)

---

## 1. GitHub Releases (automated)

### How it works

Push a version tag and the release workflow handles everything:

```bash
# After updating VERSION, release-manifest.json, and CHANGELOG.md:
git tag -a v0.4.0 -m "v0.4.0: Launch release"
git push origin main --tags
```

The `.github/workflows/release.yml` workflow will:
1. Build a release binary
2. Package the `.app` bundle with the tag version
3. Code sign with your Developer ID certificate
4. Notarize with Apple
5. Staple the notarization ticket
6. Extract the matching release notes from `CHANGELOG.md`
7. Zip and attach to the GitHub Release
8. Update the Homebrew cask formula

### Release notes source of truth

`CHANGELOG.md` is the canonical source for GitHub Release body content.

The workflow uses:

```bash
python3 Scripts/extract_release_notes.py "$VERSION" CHANGELOG.md
```

to build the markdown body for the matching tag.

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
  version "0.4.0"
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

## Monorepo site layout

The marketing website lives in `site/` within this repo. It is deployed via Vercel with `site/` as the publish root.

The site reads release metadata from `site/data/release-manifest.json` to display the current version and download links. This file should always match the root-level `release-manifest.json`.

See `site/README.md` for local preview instructions.

---

## Version checklist

When releasing a new version:

1. Update `VERSION` with the new version number
2. Update `release-manifest.json` with the new version, asset URL, highlights, and publishedAt
3. Copy `release-manifest.json` to `site/data/release-manifest.json`
4. Update `CHANGELOG.md` with the new version and changes
5. Verify the homepage, README, and launch assets all reflect the same version and install path
6. Commit: `git commit -m "Prepare v0.x.0 release"`
7. Tag: `git tag -a v0.x.0 -m "v0.x.0: Description"`
8. Push: `git push origin main --tags`
9. The release workflow handles the rest

The version flows automatically from the git tag into:
- `CFBundleShortVersionString` in Info.plist
- GitHub Release title
- GitHub Release body (via `CHANGELOG.md`)
- Homebrew cask formula

Local builds via `Scripts/package_app.sh` read the version from the `VERSION` file at the repo root.
