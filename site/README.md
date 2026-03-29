# Portpourri Website

The marketing site for [Portpourri](https://github.com/jskoiz/portpourri), a macOS menu bar app for local port monitoring.

## Local preview

```bash
cd site
python3 -m http.server 8000
# Open http://localhost:8000
```

## Deploy

The site is deployed via Vercel from the app repo with `site/` as the publish root.

## Release metadata

The site reads version and download info from `data/release-manifest.json`. This file should match the root-level `release-manifest.json` in the repo. Do not hardcode version numbers in the HTML.
