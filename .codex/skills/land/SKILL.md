---
name: land
description: |
  Land the current BRDG pull request safely by resolving drift, waiting for
  checks, and merging only when review feedback is addressed.
---

# Land

1. Ensure the working tree is clean.
2. Find the PR for the current branch with `gh pr view`.
3. Confirm outstanding review feedback is addressed before merge.
4. If the PR conflicts with `main`, run the `pull` skill, resolve conflicts, rerun validation, and push.
5. Wait for checks with `gh pr checks --watch`.
6. If checks fail, inspect the failing run, fix the issue locally, rerun the needed validation, then commit and push before continuing.
7. When checks are green and the PR is approved, squash-merge with the current PR title and body.
8. After merge, move the Linear issue to `Done`.
