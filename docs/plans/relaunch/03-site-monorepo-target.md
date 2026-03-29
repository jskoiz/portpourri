# Target Website Monorepo Structure

This document defines the target structure after the site moves into the app repo.

## Goal

Eliminate the separate website repo and keep site, app, releases, screenshots, and version metadata in one canonical repository.

## Recommended structure

```text
portpourri/
  site/
    index.html
    css/
      style.css
    js/
      main.js
    assets/
      screenshots/
      logos/
      social/
    data/
      release-manifest.json
    README.md
  docs/
    plans/
      relaunch/
        ...
  Sources/
  Scripts/
  VERSION
  release-manifest.json
```

## Why `site/`

Use `site/` instead of `docs/` or a second repo because:

- it stays clearly separate from product docs
- it is easy to point Vercel or another static deploy target at one folder
- it matches the current static HTML/CSS/JS site shape
- it keeps screenshots and site assets close to the product repo

## Canonical metadata flow

### Root-level canonical files
- `VERSION`
- `release-manifest.json`

### Site-consumed files
- `site/data/release-manifest.json` or generated equivalent

The site should never hardcode:
- current version
- download asset URL
- latest changelog bullets
- GitHub repo URL

Those should derive from the manifest.

## Recommended manifest shape

```json
{
  "version": "0.3.2",
  "build": "0.3.2",
  "gitSha": "abcdef1",
  "publishedAt": "2026-03-29T02:36:00Z",
  "assetName": "Portpourri-0.3.2-mac.zip",
  "assetUrl": "https://github.com/jskoiz/portpourri/releases/download/v0.3.2/Portpourri-0.3.2-mac.zip",
  "repoUrl": "https://github.com/jskoiz/portpourri",
  "releaseNotesUrl": "https://github.com/jskoiz/portpourri/releases/tag/v0.3.2",
  "highlights": [
    "Literal product positioning",
    "Conflict-first homepage demo",
    "Dot Matrix now reflects watched-port state"
  ]
}
```

## Deploy rule

The deploy target should build from the app repo and use `site/` as the publish root.

## Migration checklist

- move the site files into `site/`
- update Vercel or hosting config to point to the app repo
- update all repo/site links to the app repo
- document local preview instructions in `site/README.md`

## Migration sequence rule

Use this order exactly:

1. import the current site into `site/`
2. make the app repo deployable as the site source
3. verify the live deploy from the app repo
4. freeze or archive the old separate site repo as read-only

Do not archive the old site repo before the live deploy from the app repo is confirmed working.

## Non-goals

- full frontend rewrite
- framework migration
- redesign by default

This is a **repo simplification and message alignment move**, not a rebuild.

## Agent instruction block

When moving the site into the app repo, preserve working URLs and visuals where possible.
Prefer structural simplification, source-of-truth cleanup, and deploy hygiene over cosmetic rework.
