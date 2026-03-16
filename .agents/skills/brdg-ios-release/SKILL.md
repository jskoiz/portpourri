---
name: brdg-ios-release
description: Prepare, verify, or summarize the BRDG iOS release workflow using the repo's App Store and TestFlight docs. Use when the task involves TestFlight rollout, App Store metadata, release-readiness checks, EAS/Xcode release commands, or pre-submission verification for the BRDG mobile app.
---

# BRDG iOS Release

Use this skill to drive BRDG iOS release work from the repo docs instead of re-deriving the process from memory.

## Workflow

1. Read [`../../../docs/APP_STORE_RELEASE.md`](../../../docs/APP_STORE_RELEASE.md) first.
2. Read [`../../../docs/APP_STORE_CONNECT_METADATA.md`](../../../docs/APP_STORE_CONNECT_METADATA.md) when the task involves App Store Connect fields, screenshots, build attachment, or review metadata.
3. Read [`../../../docs/testflight-honolulu-rollout-2026-03-11.md`](../../../docs/testflight-honolulu-rollout-2026-03-11.md) only when you need the latest known rollout artifact history.
4. Verify local release commands against [`../../../mobile/package.json`](../../../mobile/package.json) and [`../../../mobile/eas.json`](../../../mobile/eas.json) before suggesting execution.
5. Summarize blockers separately from completed release prep so the user can act quickly.

## Guardrails

- Treat uncommitted env files and Apple credentials as external prerequisites; do not invent them.
- Prefer repo-documented commands over generic Expo or Xcode advice when the docs already cover the step.
- Treat BRDG as an Expo-based app with a local Xcode TestFlight/App Store release path by default; do not infer that Expo login or EAS is required unless the user explicitly asks for EAS.
- When release state depends on App Store Connect or EAS, say what must be checked live versus what is confirmed from the repo.
- Update the release docs if you materially change the release workflow.
