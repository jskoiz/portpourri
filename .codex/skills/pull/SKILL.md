---
name: pull
description: |
  Merge the latest `origin/main` into the current branch, resolve conflicts,
  and keep BRDG validation expectations intact.
---

# Pull

1. Ensure the working tree is clean, or commit/stash before merging.
2. Enable rerere locally:
   - `git config rerere.enabled true`
   - `git config rerere.autoupdate true`
3. Fetch latest refs with `git fetch origin`.
4. Fast-forward the current branch from remote when it already exists:
   - `git pull --ff-only origin $(git branch --show-current)`
5. Merge `origin/main` with clearer conflict context:
   - `git -c merge.conflictstyle=zdiff3 merge origin/main`
6. Resolve conflicts carefully. Preserve BRDG API contracts, seeded-data assumptions, and harness behavior unless the task explicitly changes them.
7. After resolving conflicts:
   - `git add <resolved files>`
   - `git commit` or `git merge --continue`
8. Run the smallest validation that proves the merge did not break the affected scope, following `docs/HARNESS.md`.
